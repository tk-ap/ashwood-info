(() => {
  const routes = ["/portfolio/", "/music/", "/journal/", "/about/"];
  const target = routes[Math.floor(Math.random() * routes.length)];
  const link = document.querySelector(".iridescent-word");
  if (!link) return;
  link.addEventListener("click", (event) => {
    event.preventDefault();
    try { sessionStorage.setItem("ashwood.curiosity.walkthrough", "1"); } catch (_) {}
    window.location.assign(`${target}?curious=1`);
  });
})();
