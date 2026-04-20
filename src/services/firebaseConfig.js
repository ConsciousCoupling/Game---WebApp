const FIREBASE_ENV_FIELDS = [
  { envKey: "VITE_FIREBASE_API_KEY", configKey: "apiKey" },
  { envKey: "VITE_FIREBASE_AUTH_DOMAIN", configKey: "authDomain" },
  { envKey: "VITE_FIREBASE_PROJECT_ID", configKey: "projectId" },
  { envKey: "VITE_FIREBASE_STORAGE_BUCKET", configKey: "storageBucket" },
  {
    envKey: "VITE_FIREBASE_MESSAGING_SENDER_ID",
    configKey: "messagingSenderId",
  },
  { envKey: "VITE_FIREBASE_APP_ID", configKey: "appId" },
];

function normalizeEnvValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function getFirebaseConfigFromEnv(envSource = {}) {
  return FIREBASE_ENV_FIELDS.reduce((config, field) => {
    config[field.configKey] = normalizeEnvValue(envSource[field.envKey]);
    return config;
  }, {});
}

export function validateFirebaseConfig(config, { context = "runtime" } = {}) {
  const missingEnvKeys = FIREBASE_ENV_FIELDS.filter(
    (field) => !config[field.configKey]
  ).map((field) => field.envKey);

  if (missingEnvKeys.length) {
    throw new Error(
      `Firebase configuration error (${context}): missing required environment variable(s): ${missingEnvKeys.join(
        ", "
      )}. Netlify must provide the VITE_FIREBASE_* client environment variables.`
    );
  }

  if (!config.apiKey.startsWith("AIza")) {
    throw new Error(
      `Firebase configuration error (${context}): VITE_FIREBASE_API_KEY format is invalid. Netlify must provide the VITE_FIREBASE_* client environment variables.`
    );
  }
}

export function getValidatedFirebaseConfig(envSource, options) {
  const config = getFirebaseConfigFromEnv(envSource);
  validateFirebaseConfig(config, options);
  return config;
}
