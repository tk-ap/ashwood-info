(() => {
  const key = "ashwood.theme";
  const root = document.documentElement;
  let light = false;
  try { light = localStorage.getItem(key) === "light"; } catch (_) {}
  root.classList.toggle("ashwood-light", light);
  const makeButton = () => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "theme-toggle";
    button.setAttribute("aria-label", light ? "Use dark mode" : "Use light mode");
    button.innerHTML = '<span aria-hidden="true">◐</span><span class="theme-toggle__label">Light mode</span>';
    button.addEventListener("click", () => {
      light = !light;
      root.classList.toggle("ashwood-light", light);
      button.setAttribute("aria-label", light ? "Use dark mode" : "Use light mode");
      button.querySelector(".theme-toggle__label").textContent = light ? "Dark mode" : "Light mode";
      try { localStorage.setItem(key, light ? "light" : "dark"); } catch (_) {}
    });
    return button;
  };
  document.querySelectorAll(".masthead,.site-header,.journal-masthead").forEach((header) => header.append(makeButton()));
  document.querySelectorAll("footer").forEach((footer) => footer.append(makeButton()));
})();
