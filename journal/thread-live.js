(() => {
  const path = location.pathname.replace(/\/+$/, "");
  const builds = {
    "/journal/alvira": {
      name: "ALVIRA",
      category: "Context Intelligence",
      url: "https://alviratech.vercel.app/",
      note: "Current public landing surface. The product itself continues beyond what this frame can show."
    },
    "/journal/ailhat": {
      name: "ailhat",
      category: "Portfolio Intelligence",
      url: "https://ailhat.vercel.app/",
      note: "Current public landing surface. Account-level intelligence remains deeper in the product."
    },
    "/journal/ledgato": {
      name: "LEDGATo",
      category: "Operational Reality",
      url: "https://ledgato.vercel.app/",
      note: "Current public landing surface. Runtime capability and public presentation are intentionally distinguished."
    }
  };

  const build = builds[path];
  if (!build) return;
  const hero = document.querySelector(".thread-hero");
  if (!hero) return;

  const section = document.createElement("section");
  section.className = "thread-live";
  section.setAttribute("aria-label", `${build.name} live product surface`);
  section.innerHTML = `
    <div class="thread-live__header">
      <div>
        <p class="thread-label">LIVE SURFACE / CURRENT BUILD</p>
        <h2>See the artifact while you read the record.</h2>
        <p>${build.note}</p>
      </div>
      <a class="thread-live__open" href="${build.url}" target="_blank" rel="noreferrer">Open ${build.name} ↗</a>
    </div>
    <div class="thread-live__frame">
      <div class="thread-live__chrome" aria-hidden="true">
        <span></span><span></span><span></span>
        <strong>${build.name} · ${build.category}</strong>
        <em>LIVE</em>
      </div>
      <iframe src="${build.url}" title="Live ${build.name} landing page" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>
      <noscript><p>Open the live build directly to view the current landing page.</p></noscript>
    </div>
    <p class="thread-live__footnote">This is the live public surface, not a frozen marketing screenshot. If the embedded site is unavailable in your browser, use “Open ${build.name}” above.</p>
  `;
  hero.insertAdjacentElement("afterend", section);
})();
