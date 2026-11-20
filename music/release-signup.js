(() => {
  const status = document.querySelector("#music-signup-status");
  if (!status) return;
  const notices = new Map([
    ["pending", "Check your email for a confirmation link."],
    ["confirmed", "You’re on the list for new t.kap releases."],
    ["unsubscribed", "You’re unsubscribed from t.kap release updates."],
    ["invalid", "Enter a valid email address and try again."],
    ["expired", "That link is invalid or expired. Sign up again for a fresh link."],
    ["error", "Email signup is unavailable right now. Please try again later."]
  ]);
  status.textContent = notices.get(new URLSearchParams(location.search).get("releases")) || "";
})();
