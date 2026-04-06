export function requestTurnNotificationPermission() {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return;
  }

  if (Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
}

export function showTurnNotification(playerName) {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return null;
  }

  if (Notification.permission !== "granted") {
    return null;
  }

  const notification = new Notification("Your turn in Intima-Date", {
    body: `${playerName}, it’s your turn. Roll the die when you’re ready.`,
    tag: "intimadate-turn",
    renotify: true,
  });

  window.setTimeout(() => {
    notification.close();
  }, 5000);

  return notification;
}
