(() => {
  if ((window.location.pathname.replace(/\/$/, "") || "/") !== "/journal") return;
  if (document.getElementById("alvira-aug29-update")) return;

  const journal = document.querySelector("#journal-content");
  if (!journal) return;

  const index = document.querySelector(".journal-index");
  if (index && !index.querySelector('a[href="#alvira-aug29-update"]')) {
    const link = document.createElement("a");
    link.href = "#alvira-aug29-update";
    link.textContent = "ALVIRA now";
    index.append(link);
  }

  const bet = [...document.querySelectorAll(".bet-list article")].find((article) => article.textContent?.includes("BET 01 · ALVIRA"));
  if (bet) {
    bet.innerHTML = `
      <div><span>BET 01 · ALVIRA</span><h3>Maintained, inspectable, user-owned Context becomes more useful than starting over.</h3></div>
      <div><strong>EVIDENCE NEEDED</strong><p>People return to correct and deepen Context, notice useful continuity across sessions, use Reflect and History to understand change, and value being able to carry that understanding elsewhere.</p></div>
      <div><strong>WHAT WOULD CHANGE MY MIND</strong><p>If repeated use adds little beyond the first interview, or ownership and portability do not matter in practice, ALVIRA should narrow rather than keep adding layers.</p></div>`;
  }

  const systemAlvira = [...document.querySelectorAll(".system-map article")].find((article) => article.querySelector("h3")?.textContent?.trim() === "ALVIRA");
  if (systemAlvira) {
    systemAlvira.innerHTML = `<span>CONTEXT INTELLIGENCE</span><h3>ALVIRA</h3><p>Builds maintained Context through capture, understanding, reflection, updating, history, and reuse. Reflect is now part of the same product loop; Dossier is the emerging ownership and portability layer rather than a separate product.</p><small>ACTIVE BUILD · LIVE CONTEXT LOOP · FOUNDING BETA FORMING</small>`;
  }

  const existingLatest = [...document.querySelectorAll(".archive-feature")].find((section) => section.textContent?.includes("LATEST FROM THE BUILD"));
  if (existingLatest) {
    const section = document.createElement("section");
    section.id = "alvira-aug29-update";
    section.className = "archive-feature";
    section.setAttribute("aria-labelledby", "alvira-aug29-title");
    section.innerHTML = `
      <div class="section-marker"><span>02A</span><span>LATEST FROM ALVIRA / PRODUCT CONSOLIDATION</span></div>
      <article class="founder-entry founder-entry--feature">
        <div class="founder-entry__meta"><span>AUG 29, 2026</span><span>ALVIRA · PRODUCT + COMMERCIAL DECISION</span></div>
        <div class="founder-entry__body">
          <h2 id="alvira-aug29-title">The pieces stopped needing separate prices.</h2>
          <p class="founder-entry__lede">As ALVIRA became more complete, the product architecture got simpler: Context, Reflect, History, Dossier, and Reuse are different ways of working with the same maintained understanding—not five products a new user should have to decode.</p>
          <div class="entry-reasoning">
            <div><span>WHAT CHANGED</span><p>Reflect moved from a separately priced build/care offer into the core ALVIRA loop. The public explanation also shifted from category-first language to the simpler question: why would better Context make AI more useful to me?</p></div>
            <div><span>COMMERCIAL DECISION</span><p>Free, Pro, Lifetime, and a limited Founding Beta now form the main access model. Core Reflect follows those ALVIRA tiers rather than requiring a separate purchase.</p></div>
            <div><span>OWNERSHIP DECISION</span><p>The original MeOS encrypted-dossier idea returns as ALVIRA Dossier: a forthcoming private, portable representation of maintained Context. The principle is public now even where advanced encryption, restore, and selective portability are still being built.</p></div>
            <div><span>VALIDATION DECISION</span><p>Founding Beta is a small, reviewed cohort. Approved testers receive complimentary customer-facing access for the life of the service under that account in exchange for genuine use and candid workflow, UI, relevance, and effectiveness feedback.</p></div>
          </div>
          <p class="journal-note"><strong>Current product thesis:</strong> Capture → Understand → Reflect → Update → Reuse. <strong>Current trust thesis:</strong> your Context should belong to you.</p>
          <p class="journal-note"><a href="https://alviratech.vercel.app/" target="_blank" rel="noopener">Explore current ALVIRA ↗</a> · <a href="https://alviratech.vercel.app/founding-beta?source=ashwood" target="_blank" rel="noopener">Apply for Founding Beta ↗</a></p>
        </div>
      </article>
    `;
    existingLatest.parentNode.insertBefore(section, existingLatest);
  }

  const feed = document.querySelector(".founder-entry-list");
  if (feed && !feed.querySelector('[data-alvira-current="true"]')) {
    const entries = document.createElement("div");
    entries.setAttribute("data-alvira-current", "true");
    entries.innerHTML = `
      <article class="founder-entry"><div class="founder-entry__meta"><span>AUG 29</span><span>ALVIRA · POSITIONING</span></div><div class="founder-entry__body"><h3>“Why ALVIRA for me?” became the first explanation.</h3><p>The landing experience now teaches the value in ordinary language before asking anyone to understand Context Intelligence: AI can do more for you when it knows more about you, and ALVIRA helps maintain the background that should not have to be rebuilt in every conversation.</p></div></article>
      <article class="founder-entry"><div class="founder-entry__meta"><span>AUG 29</span><span>ALVIRA · REFLECT</span></div><div class="founder-entry__body"><h3>Reflect stopped being a separate commercial product.</h3><p>Reflection is part of maintaining Context. Charging separately for the mechanism that revisits and evolves the Context contradicted the product promise, so core Reflect now follows ALVIRA tier access.</p></div></article>
      <article class="founder-entry"><div class="founder-entry__meta"><span>AUG 29</span><span>ALVIRA · OWNERSHIP</span></div><div class="founder-entry__body"><h3>MeOS came back into focus as the Dossier.</h3><p>The original encrypted-dossier concept survived, but not as another SKU. MeOS began as the dossier; ALVIRA became the system that keeps that dossier alive. The emerging public promise is that ALVIRA can maintain your Context without owning your Context.</p></div></article>
      <article class="founder-entry"><div class="founder-entry__meta"><span>AUG 29</span><span>ALVIRA · VALIDATION</span></div><div class="founder-entry__body"><h3>Founding Beta became a deliberate evidence loop.</h3><p>The cohort is intentionally small and application-based. The exchange is explicit: long-term complimentary access for approved testers, with real usage and candid feedback helping determine whether ALVIRA becomes more viable for the people who come next.</p></div></article>`;
    while (entries.firstElementChild) feed.prepend(entries.lastElementChild);
  }

  const alviraThread = [...document.querySelectorAll(".thread-list article")].find((article) => article.querySelector("h3")?.textContent?.trim() === "ALVIRA");
  if (alviraThread) {
    alviraThread.innerHTML = `<span>CONTEXT INTELLIGENCE</span><h3>ALVIRA</h3><p>From interview-driven profile building toward one maintained system: Context to hold understanding, Reflect to examine it, History to show change, Dossier to preserve user ownership, and Reuse/Bridge to put appropriate Context to work.</p>`;
  }

  const themes = document.querySelector(".theme-list");
  if (themes) {
    ["Your Context should belong to you", "Simplify before monetizing the parts", "Validation before scale"].forEach((label) => {
      if ([...themes.querySelectorAll("span")].some((span) => span.textContent === label)) return;
      const item = document.createElement("span");
      item.textContent = label;
      themes.append(item);
    });
  }

  const openAlvira = [...document.querySelectorAll(".open-builds article")].find((article) => article.textContent?.includes("OPEN BUILD · ALVIRA"));
  if (openAlvira) {
    const heading = openAlvira.querySelector("h3");
    if (heading) heading.textContent = "Prove that maintained Context changes the work.";
    const intro = heading?.nextElementSibling;
    if (intro) intro.textContent = "The product loop now exists across capture, reflection, updating, early history, reuse, and visible live Context. The next proof is repeated real use: whether continuity, correction, and ownership make AI meaningfully more useful over time.";
    const proof = [...openAlvira.querySelectorAll("dt")].find((dt) => dt.textContent === "CURRENT PROOF")?.parentElement?.querySelector("dd");
    if (proof) proof.textContent = "Working Context surfaces, Reflect integration, early History/Reuse, Founding Beta instrumentation, and clearer ownership positioning are live or integrated. Longitudinal user value is still the core unproven claim.";
    if (!openAlvira.querySelector(".alvira-beta-link")) {
      const p = document.createElement("p");
      p.className = "journal-note alvira-beta-link";
      p.innerHTML = '<a href="https://alviratech.vercel.app/founding-beta?source=ashwood" target="_blank" rel="noopener">Interested in testing the workflow? Apply for the limited ALVIRA Founding Beta ↗</a>';
      openAlvira.append(p);
    }
  }
})();
