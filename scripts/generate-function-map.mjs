#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default ?? traverseModule;
const rootDir = process.cwd();
const srcDir = path.join(rootDir, 'src');

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function startsUppercase(value) {
  return Boolean(value) && /^[A-Z]/.test(value);
}

function startsHook(value) {
  return Boolean(value) && /^use[A-Z0-9_]/.test(value);
}

function inferFunctionName(pathRef, node) {
  if (node.id && node.id.type === 'Identifier') {
    return { name: node.id.name, anonymous: false };
  }

  const parent = pathRef.parentPath;
  if (!parent) {
    return { name: null, anonymous: true };
  }

  if (parent.isVariableDeclarator() && parent.node.id.type === 'Identifier') {
    return { name: parent.node.id.name, anonymous: false };
  }

  if (parent.isAssignmentExpression()) {
    const left = parent.node.left;
    if (left.type === 'Identifier') {
      return { name: left.name, anonymous: false };
    }
    if (left.type === 'MemberExpression' && !left.computed && left.property.type === 'Identifier') {
      return { name: left.property.name, anonymous: false };
    }
  }

  if (parent.isObjectProperty()) {
    const key = parent.node.key;
    if (key.type === 'Identifier') {
      return { name: key.name, anonymous: false };
    }
    if (key.type === 'StringLiteral') {
      return { name: key.value, anonymous: false };
    }
  }

  if (parent.isObjectMethod() || parent.isClassMethod()) {
    const key = parent.node.key;
    if (key?.type === 'Identifier') {
      return { name: key.name, anonymous: false };
    }
    if (key?.type === 'StringLiteral') {
      return { name: key.value, anonymous: false };
    }
  }

  if (parent.isExportDefaultDeclaration()) {
    return { name: 'default', anonymous: false };
  }

  return { name: null, anonymous: true };
}

function extractCalleeInfo(callee) {
  if (!callee) {
    return null;
  }

  if (callee.type === 'Identifier') {
    return {
      usageType: 'identifier',
      identifier: callee.name,
      raw: callee.name,
    };
  }

  if (callee.type === 'MemberExpression' && !callee.computed) {
    const object = callee.object;
    const property = callee.property;
    if (object.type === 'Identifier' && property.type === 'Identifier') {
      return {
        usageType: 'member',
        object: object.name,
        member: property.name,
        raw: `${object.name}.${property.name}`,
      };
    }
  }

  return null;
}

function extractJsxInfo(nameNode) {
  if (!nameNode) {
    return null;
  }

  if (nameNode.type === 'JSXIdentifier') {
    return {
      usageType: 'identifier',
      identifier: nameNode.name,
      raw: nameNode.name,
    };
  }

  if (nameNode.type === 'JSXMemberExpression') {
    const segments = [];
    let cursor = nameNode;
    while (cursor) {
      if (cursor.type === 'JSXIdentifier') {
        segments.unshift(cursor.name);
        break;
      }
      if (cursor.type !== 'JSXMemberExpression') {
        break;
      }
      if (cursor.property?.type === 'JSXIdentifier') {
        segments.unshift(cursor.property.name);
      }
      cursor = cursor.object;
    }

    if (segments.length >= 2) {
      const object = segments[0];
      const member = segments.slice(1).join('.');
      return {
        usageType: 'member',
        object,
        member,
        raw: segments.join('.'),
      };
    }
  }

  return null;
}

async function listSourceFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await listSourceFiles(full)));
      continue;
    }
    if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.jsx'))) {
      out.push(full);
    }
  }
  return out;
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveImportPath(fromAbsPath, importSource) {
  if (!importSource.startsWith('.')) {
    return null;
  }

  const base = path.resolve(path.dirname(fromAbsPath), importSource);
  const candidates = [
    base,
    `${base}.js`,
    `${base}.jsx`,
    path.join(base, 'index.js'),
    path.join(base, 'index.jsx'),
  ];

  for (const candidate of candidates) {
    if (await exists(candidate)) {
      return toPosix(path.relative(rootDir, candidate));
    }
  }

  return null;
}

function getFunctionKind(fn) {
  if (fn.isModuleScope) return 'module-scope';
  if (fn.isHook) return 'hook';
  if (fn.isComponent) return 'component';
  if (fn.anonymous) return 'anonymous';
  return 'function';
}

function cleanText(value) {
  return String(value).replace(/`/g, '\\`');
}

function formatFnRef(fn, withLine = true) {
  return withLine
    ? `${fn.filePath}:${fn.startLine}::${fn.name}`
    : `${fn.filePath}::${fn.name}`;
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function lookupNamedExport(exportsIndex, resolvedFile, exportedName) {
  if (!resolvedFile) return [];
  const entry = exportsIndex.get(resolvedFile);
  if (!entry) return [];
  return entry.named.get(exportedName) ?? [];
}

function lookupDefaultExport(exportsIndex, resolvedFile) {
  if (!resolvedFile) return [];
  const entry = exportsIndex.get(resolvedFile);
  if (!entry) return [];
  return entry.defaultIds;
}

function chooseLocalFunctionsByName(fileInfo, name) {
  if (!name) return [];
  const fnIds = fileInfo.functionsByName.get(name) ?? [];
  return fnIds.filter((id) => id !== fileInfo.moduleNodeId);
}

function labelExternalUsage(fileInfo, usage) {
  if (usage.usageType === 'identifier') {
    const binding = fileInfo.importByLocal.get(usage.identifier);
    if (!binding) {
      return usage.raw;
    }
    if (binding.resolvedFile) {
      return `${usage.raw} (imported from ${binding.resolvedFile})`;
    }
    return `${usage.raw} (from ${binding.source})`;
  }

  if (usage.usageType === 'member') {
    const binding = fileInfo.importByLocal.get(usage.object);
    if (!binding) {
      return usage.raw;
    }
    if (binding.resolvedFile) {
      return `${usage.raw} (imported from ${binding.resolvedFile})`;
    }
    return `${usage.raw} (from ${binding.source})`;
  }

  return usage.raw;
}

function resolveUsageTargets(fileInfo, usage, exportsIndex) {
  if (usage.usageType === 'identifier') {
    const local = chooseLocalFunctionsByName(fileInfo, usage.identifier);
    if (local.length) {
      return { internal: local, external: [] };
    }

    const binding = fileInfo.importByLocal.get(usage.identifier);
    if (!binding) {
      return { internal: [], external: [labelExternalUsage(fileInfo, usage)] };
    }

    if (!binding.resolvedFile) {
      return { internal: [], external: [labelExternalUsage(fileInfo, usage)] };
    }

    if (binding.kind === 'default') {
      const ids = lookupDefaultExport(exportsIndex, binding.resolvedFile);
      if (ids.length) {
        return { internal: ids, external: [] };
      }
      return { internal: [], external: [labelExternalUsage(fileInfo, usage)] };
    }

    if (binding.kind === 'named') {
      const ids = lookupNamedExport(exportsIndex, binding.resolvedFile, binding.imported);
      if (ids.length) {
        return { internal: ids, external: [] };
      }
      return { internal: [], external: [labelExternalUsage(fileInfo, usage)] };
    }

    return { internal: [], external: [labelExternalUsage(fileInfo, usage)] };
  }

  if (usage.usageType === 'member') {
    const binding = fileInfo.importByLocal.get(usage.object);
    if (!binding || binding.kind !== 'namespace') {
      return { internal: [], external: [labelExternalUsage(fileInfo, usage)] };
    }

    if (!binding.resolvedFile) {
      return { internal: [], external: [labelExternalUsage(fileInfo, usage)] };
    }

    const ids = lookupNamedExport(exportsIndex, binding.resolvedFile, usage.member);
    if (ids.length) {
      return { internal: ids, external: [] };
    }

    return { internal: [], external: [labelExternalUsage(fileInfo, usage)] };
  }

  return { internal: [], external: [usage.raw] };
}

async function main() {
  const sourceFiles = (await listSourceFiles(srcDir))
    .map((absPath) => ({ absPath, relPath: toPosix(path.relative(rootDir, absPath)) }))
    .sort((a, b) => a.relPath.localeCompare(b.relPath));

  const fileInfos = new Map();
  const parseErrors = [];

  for (const file of sourceFiles) {
    const code = await fs.readFile(file.absPath, 'utf8');
    let ast;

    try {
      ast = parse(code, {
        sourceType: 'module',
        plugins: ['jsx'],
        errorRecovery: true,
      });
    } catch (error) {
      parseErrors.push(`${file.relPath}: ${error.message}`);
      continue;
    }

    const info = {
      filePath: file.relPath,
      absPath: file.absPath,
      imports: [],
      importByLocal: new Map(),
      exportsNamed: new Map(),
      defaultExportLocal: null,
      functions: [],
      functionById: new Map(),
      functionsByName: new Map(),
      calls: [],
      renders: [],
      moduleNodeId: `${file.relPath}::__module__`,
    };

    const moduleNode = {
      id: info.moduleNodeId,
      filePath: file.relPath,
      name: '[module]',
      startLine: 1,
      startColumn: 1,
      endLine: 1,
      nodeType: 'Module',
      parentId: null,
      anonymous: false,
      isComponent: false,
      isHook: false,
      isModuleScope: true,
      exportedDefault: false,
      exportedNamedAs: [],
      callsInternal: new Set(),
      callsExternal: new Set(),
      calledByInternal: new Set(),
      rendersInternal: new Set(),
      rendersExternal: new Set(),
      renderedByInternal: new Set(),
    };

    info.functions.push(moduleNode);
    info.functionById.set(moduleNode.id, moduleNode);
    info.functionsByName.set(moduleNode.name, [moduleNode.id]);

    const functionStack = [];

    function currentFunctionId() {
      return functionStack.length ? functionStack[functionStack.length - 1] : info.moduleNodeId;
    }

    traverse(ast, {
      ImportDeclaration(pathRef) {
        const source = pathRef.node.source.value;
        const base = {
          source,
          resolvedFile: null,
        };

        pathRef.node.specifiers.forEach((specifier) => {
          if (specifier.type === 'ImportDefaultSpecifier') {
            const binding = {
              ...base,
              kind: 'default',
              local: specifier.local.name,
              imported: 'default',
            };
            info.imports.push(binding);
            info.importByLocal.set(binding.local, binding);
            return;
          }

          if (specifier.type === 'ImportSpecifier') {
            const imported = specifier.imported.type === 'Identifier'
              ? specifier.imported.name
              : specifier.imported.value;
            const binding = {
              ...base,
              kind: 'named',
              local: specifier.local.name,
              imported,
            };
            info.imports.push(binding);
            info.importByLocal.set(binding.local, binding);
            return;
          }

          if (specifier.type === 'ImportNamespaceSpecifier') {
            const binding = {
              ...base,
              kind: 'namespace',
              local: specifier.local.name,
              imported: '*',
            };
            info.imports.push(binding);
            info.importByLocal.set(binding.local, binding);
          }
        });
      },

      ExportNamedDeclaration(pathRef) {
        if (pathRef.node.declaration) {
          const declaration = pathRef.node.declaration;
          if (declaration.type === 'FunctionDeclaration' && declaration.id) {
            info.exportsNamed.set(declaration.id.name, declaration.id.name);
          }

          if (declaration.type === 'VariableDeclaration') {
            declaration.declarations.forEach((decl) => {
              if (decl.id.type === 'Identifier') {
                info.exportsNamed.set(decl.id.name, decl.id.name);
              }
            });
          }
        }

        pathRef.node.specifiers.forEach((spec) => {
          if (spec.type !== 'ExportSpecifier') return;
          const localName = spec.local.type === 'Identifier' ? spec.local.name : null;
          const exportedName = spec.exported.type === 'Identifier'
            ? spec.exported.name
            : spec.exported.value;
          if (localName && exportedName) {
            info.exportsNamed.set(exportedName, localName);
          }
        });
      },

      ExportDefaultDeclaration(pathRef) {
        const declaration = pathRef.node.declaration;
        if (declaration.type === 'Identifier') {
          info.defaultExportLocal = declaration.name;
          return;
        }

        if ((declaration.type === 'FunctionDeclaration' || declaration.type === 'ClassDeclaration') && declaration.id?.name) {
          info.defaultExportLocal = declaration.id.name;
          return;
        }

        if (declaration.type === 'FunctionDeclaration' || declaration.type === 'FunctionExpression' || declaration.type === 'ArrowFunctionExpression') {
          info.defaultExportLocal = 'default';
          return;
        }
      },

      Function: {
        enter(pathRef) {
          const node = pathRef.node;
          const loc = node.loc?.start;
          const endLoc = node.loc?.end;
          if (!loc || !endLoc) {
            return;
          }

          const inferred = inferFunctionName(pathRef, node);
          const name = inferred.name ?? `anon_L${loc.line}_C${loc.column + 1}`;
          const id = `${file.relPath}:${loc.line}:${loc.column + 1}:${name}:${info.functions.length}`;
          const parentId = currentFunctionId();

          const fn = {
            id,
            filePath: file.relPath,
            name,
            startLine: loc.line,
            startColumn: loc.column + 1,
            endLine: endLoc.line,
            nodeType: node.type,
            parentId,
            anonymous: inferred.anonymous,
            isComponent: startsUppercase(name) && !name.startsWith('React'),
            isHook: startsHook(name),
            isModuleScope: false,
            exportedDefault: false,
            exportedNamedAs: [],
            callsInternal: new Set(),
            callsExternal: new Set(),
            calledByInternal: new Set(),
            rendersInternal: new Set(),
            rendersExternal: new Set(),
            renderedByInternal: new Set(),
          };

          info.functions.push(fn);
          info.functionById.set(id, fn);
          if (!info.functionsByName.has(name)) {
            info.functionsByName.set(name, []);
          }
          info.functionsByName.get(name).push(id);

          functionStack.push(id);
        },

        exit() {
          functionStack.pop();
        },
      },

      CallExpression(pathRef) {
        const usage = extractCalleeInfo(pathRef.node.callee);
        if (!usage) return;

        info.calls.push({
          ...usage,
          fromId: currentFunctionId(),
          line: pathRef.node.loc?.start?.line ?? null,
        });
      },

      NewExpression(pathRef) {
        const usage = extractCalleeInfo(pathRef.node.callee);
        if (!usage) return;

        info.calls.push({
          ...usage,
          fromId: currentFunctionId(),
          line: pathRef.node.loc?.start?.line ?? null,
          viaNew: true,
        });
      },

      JSXOpeningElement(pathRef) {
        const usage = extractJsxInfo(pathRef.node.name);
        if (!usage) return;

        const isLikelyComponent = usage.usageType === 'identifier'
          ? startsUppercase(usage.identifier)
          : startsUppercase(usage.object);

        if (!isLikelyComponent) {
          return;
        }

        info.renders.push({
          ...usage,
          fromId: currentFunctionId(),
          line: pathRef.node.loc?.start?.line ?? null,
        });
      },
    });

    for (const importBinding of info.imports) {
      importBinding.resolvedFile = await resolveImportPath(file.absPath, importBinding.source);
    }

    if (!info.defaultExportLocal) {
      const exportDefault = code.match(/export\s+default\s+([A-Za-z_$][\w$]*)\s*;?/);
      if (exportDefault?.[1]) {
        info.defaultExportLocal = exportDefault[1];
      }
    }

    fileInfos.set(file.relPath, info);
  }

  const exportsIndex = new Map();

  for (const [filePath, info] of fileInfos.entries()) {
    const named = new Map();

    for (const [exportedName, localName] of info.exportsNamed.entries()) {
      const ids = info.functionsByName.get(localName) ?? [];
      const filtered = ids.filter((id) => id !== info.moduleNodeId);
      if (filtered.length) {
        named.set(exportedName, filtered);
        filtered.forEach((id) => {
          const fn = info.functionById.get(id);
          if (fn) {
            fn.exportedNamedAs.push(exportedName);
          }
        });
      }
    }

    let defaultIds = [];
    if (info.defaultExportLocal) {
      defaultIds = (info.functionsByName.get(info.defaultExportLocal) ?? []).filter(
        (id) => id !== info.moduleNodeId,
      );
      defaultIds.forEach((id) => {
        const fn = info.functionById.get(id);
        if (fn) {
          fn.exportedDefault = true;
        }
      });
    }

    exportsIndex.set(filePath, {
      named,
      defaultIds,
    });
  }

  for (const info of fileInfos.values()) {
    for (const call of info.calls) {
      const fromFn = info.functionById.get(call.fromId);
      if (!fromFn) continue;

      const targets = resolveUsageTargets(info, call, exportsIndex);
      if (targets.internal.length) {
        targets.internal.forEach((targetId) => {
          fromFn.callsInternal.add(targetId);
          const [targetFilePath] = targetId.split(':');
          const targetFile = fileInfos.get(targetFilePath);
          const targetFn = targetFile?.functionById.get(targetId);
          if (targetFn) {
            targetFn.calledByInternal.add(fromFn.id);
          }
        });
      }
      targets.external.forEach((label) => fromFn.callsExternal.add(label));
    }

    for (const render of info.renders) {
      const fromFn = info.functionById.get(render.fromId);
      if (!fromFn) continue;

      const targets = resolveUsageTargets(info, render, exportsIndex);
      if (targets.internal.length) {
        targets.internal.forEach((targetId) => {
          fromFn.rendersInternal.add(targetId);
          const [targetFilePath] = targetId.split(':');
          const targetFile = fileInfos.get(targetFilePath);
          const targetFn = targetFile?.functionById.get(targetId);
          if (targetFn) {
            targetFn.renderedByInternal.add(fromFn.id);
          }
        });
      }
      targets.external.forEach((label) => fromFn.rendersExternal.add(label));
    }
  }

  const allFunctions = [];
  let namedCount = 0;
  let anonymousCount = 0;
  let callEdgeCount = 0;
  let renderEdgeCount = 0;

  for (const info of fileInfos.values()) {
    for (const fn of info.functions) {
      allFunctions.push(fn);
      if (fn.isModuleScope) continue;
      if (fn.anonymous) anonymousCount += 1;
      else namedCount += 1;
      callEdgeCount += fn.callsInternal.size;
      renderEdgeCount += fn.rendersInternal.size;
    }
  }

  const lines = [];
  lines.push('# Game-WebApp Function Mindmap');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Coverage: ${fileInfos.size} files, ${namedCount + anonymousCount} functions (${namedCount} named, ${anonymousCount} anonymous)`);
  lines.push(`Internal edges: ${callEdgeCount} call edges, ${renderEdgeCount} render edges`);
  if (parseErrors.length) {
    lines.push(`Parse warnings: ${parseErrors.length}`);
  }
  lines.push('');
  lines.push('## Mindmap Diagram');
  lines.push('');
  lines.push('```mermaid');
  lines.push('mindmap');
  lines.push('  root((Game-WebApp))');

  const sortedFiles = [...fileInfos.keys()].sort((a, b) => a.localeCompare(b));
  for (const filePath of sortedFiles) {
    const info = fileInfos.get(filePath);
    lines.push(`    ${cleanText(filePath)}`);
    const functionsInFile = [...info.functions]
      .sort((a, b) => a.startLine - b.startLine || a.startColumn - b.startColumn)
      .map((fn) => {
        const tags = [];
        if (fn.isModuleScope) tags.push('module');
        if (fn.exportedDefault) tags.push('default-export');
        if (fn.exportedNamedAs.length) tags.push(`exports:${fn.exportedNamedAs.join('|')}`);
        if (fn.isHook) tags.push('hook');
        else if (fn.isComponent) tags.push('component');
        else if (fn.anonymous) tags.push('anonymous');
        const suffix = tags.length ? ` [${tags.join(',')}]` : '';
        return `${fn.name} @L${fn.startLine}${suffix}`;
      });

    for (const item of functionsInFile) {
      lines.push(`      ${cleanText(item)}`);
    }
  }

  lines.push('```');
  lines.push('');
  lines.push('## Function Responsibility Matrix');
  lines.push('');
  lines.push('`Called by` and `Rendered by` show incoming internal links. `Calls` and `Renders` show outgoing links.');
  lines.push('');

  for (const filePath of sortedFiles) {
    const info = fileInfos.get(filePath);
    const fns = [...info.functions].sort((a, b) => a.startLine - b.startLine || a.startColumn - b.startColumn);

    lines.push(`### ${filePath}`);
    lines.push('');
    lines.push('| Function | Kind | Called by | Calls | Rendered by | Renders |');
    lines.push('| --- | --- | --- | --- | --- | --- |');

    for (const fn of fns) {
      const kind = getFunctionKind(fn);
      const calledBy = uniqueSorted([...fn.calledByInternal].map((id) => {
        const [targetFilePath] = id.split(':');
        const refFn = fileInfos.get(targetFilePath)?.functionById.get(id);
        return refFn ? formatFnRef(refFn) : id;
      }));

      const calls = uniqueSorted([
        ...[...fn.callsInternal].map((id) => {
          const [targetFilePath] = id.split(':');
          const refFn = fileInfos.get(targetFilePath)?.functionById.get(id);
          return refFn ? formatFnRef(refFn) : id;
        }),
        ...fn.callsExternal,
      ]);

      const renderedBy = uniqueSorted([...fn.renderedByInternal].map((id) => {
        const [targetFilePath] = id.split(':');
        const refFn = fileInfos.get(targetFilePath)?.functionById.get(id);
        return refFn ? formatFnRef(refFn) : id;
      }));

      const renders = uniqueSorted([
        ...[...fn.rendersInternal].map((id) => {
          const [targetFilePath] = id.split(':');
          const refFn = fileInfos.get(targetFilePath)?.functionById.get(id);
          return refFn ? formatFnRef(refFn) : id;
        }),
        ...fn.rendersExternal,
      ]);

      const fnLabelParts = [`${fn.name} (L${fn.startLine})`];
      if (fn.exportedDefault) fnLabelParts.push('default export');
      if (fn.exportedNamedAs.length) fnLabelParts.push(`named export: ${fn.exportedNamedAs.join(',')}`);

      const functionCell = `\`${cleanText(fnLabelParts.join('; '))}\``;
      const calledByCell = calledBy.length ? calledBy.map((v) => `\`${cleanText(v)}\``).join('<br>') : '-';
      const callsCell = calls.length ? calls.map((v) => `\`${cleanText(v)}\``).join('<br>') : '-';
      const renderedByCell = renderedBy.length ? renderedBy.map((v) => `\`${cleanText(v)}\``).join('<br>') : '-';
      const rendersCell = renders.length ? renders.map((v) => `\`${cleanText(v)}\``).join('<br>') : '-';

      lines.push(`| ${functionCell} | ${kind} | ${calledByCell} | ${callsCell} | ${renderedByCell} | ${rendersCell} |`);
    }

    lines.push('');
  }

  if (parseErrors.length) {
    lines.push('## Parse Warnings');
    lines.push('');
    parseErrors.forEach((error) => lines.push(`- ${error}`));
    lines.push('');
  }

  const outputPath = path.join(rootDir, 'docs', 'function-mindmap.md');
  await fs.writeFile(outputPath, `${lines.join('\n')}\n`, 'utf8');

  const jsonOutput = {
    generatedAt: new Date().toISOString(),
    files: sortedFiles,
    counts: {
      fileCount: fileInfos.size,
      functionCount: namedCount + anonymousCount,
      namedCount,
      anonymousCount,
      callEdgeCount,
      renderEdgeCount,
    },
  };

  await fs.writeFile(
    path.join(rootDir, 'docs', 'function-mindmap.summary.json'),
    `${JSON.stringify(jsonOutput, null, 2)}\n`,
    'utf8',
  );

  console.log(`Wrote docs/function-mindmap.md (${namedCount + anonymousCount} functions)`);
  if (parseErrors.length) {
    console.log(`Parse warnings: ${parseErrors.length}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
