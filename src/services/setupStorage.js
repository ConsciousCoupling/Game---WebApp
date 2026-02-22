// src/services/setupStorage.js

const KEY = "intimadate.setup";

export function saveSetup(data) {
  localStorage.setItem(KEY, JSON.stringify({
    ...(loadSetup() || {}),
    ...data
  }));
}

export function loadSetup() {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

export function clearSetup() {
  localStorage.removeItem(KEY);
}

export function ensureIdentity(role) {
  const existing = localStorage.getItem("player");
  if (!existing) localStorage.setItem("player", role);
}