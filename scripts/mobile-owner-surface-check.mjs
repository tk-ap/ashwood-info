import { chromium } from "playwright";
import fs from "node:fs/promises";

const OUT = ".mobile-proof";
await fs.mkdir(OUT, { recursive: true });

const viewports = [
  { name: "iphone-390", width: 390, height: 844 },
  { name: "iphone-small", width: 375, height: 667 },
];

function json(route, body, status = 200) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

async function installMocks(page, submitted) {
  await page.route("https://api.github.com/**", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" })
  );
  await page.route("https://ailhat.vercel.app/api/product-state", route => json(route, { ok: false }));

  await page.route("https://ashwood-info.vercel.app/api/**", async route => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname;

    if (path === "/api/workspace-auth") {
      return json(route, { authenticated: true, configured: true });
    }

    if (path === "/api/workspace-state" && req.method() === "GET") {
      if (url.searchParams.get("view") === "commands") {
        return json(route, {
          ok: true,
          commands: [{
            id: "workspace-command:mobile-proof",
            command_text: "Review the current ASHWOOD sandbox on mobile.",
            command_kind: "owner_command",
            payload: { thread_id: "operator:primary", surface: "operator" },
            status: "dispatched",
            runtime_directive_id: "directive-mobile-proof",
            runtime_task_id: "task-mobile-proof",
            governance: { outcome: "ALLOW" },
            error: null,
            created_at: new Date(Date.now() - 120000).toISOString(),
            updated_at: new Date(Date.now() - 30000).toISOString(),
          }],
        });
      }
      return json(route, { ok: true, evidence: [], overrides: {}, actions: [], items: [], relationships: [] });
    }

    if (path === "/api/workspace-state" && req.method() === "POST") {
      const body = JSON.parse(req.postData() || "{}");
      submitted.push(body);
      if (body.action === "submit_owner_decision") {
        return json(route, { ok: true, existing: false, id: "owner-decision:mobile-proof", status: "queued" }, 202);
      }
      if (body.action === "submit_sandbox_change_request") {
        return json(route, { ok: true, existing: false, id: "sandbox-change:mobile-proof", status: "queued", thread_id: "operator:primary" }, 202);
      }
      return json(route, { ok: true, id: "workspace-command:submitted-mobile", status: "queued", thread_id: "operator:primary" }, 201);
    }

    if (path === "/api/workspace-board") {
      return json(route, {
        ok: true,
        rows: [{
          task_id: "task-mobile-proof",
          work_id: "work-mobile-proof",
          title: "Mobile owner surface proof",
          status: "review",
          stage: "REVIEW",
          assignee: "w-dog",
          next_gate: "Owner review",
          blocker: null,
          canonical_url: "https://github.com/tk-ap/ashwood-info/pull/163",
          updated_at: new Date().toISOString(),
          metadata: {
            outcome: "Mobile review evidence is ready.",
            review: { verdict: "PASS", finding: "No control-plane boundary regression." },
            recent_events: [{ kind: "verification", summary: "Mobile proof fixture." }],
            owner_decision: {
              card_id: "review-mobile-proof",
              actions: ["accept", "pause"],
              scope: "Accept the reviewed result or pause for correction.",
              snapshot: "snapshot-mobile-proof",
            },
          },
        }],
      });
    }

    if (path === "/api/workspace-sandbox-review") {
      if (req.method() === "PATCH") {
        return json(route, { ok: true, review: { completed_items: ["mobile"], notes: {}, updated_at: new Date().toISOString() } });
      }
      return json(route, { ok: true, review: { completed_items: [], notes: {}, updated_at: null } });
    }

    if (path === "/api/workspace-feed") return json(route, { ok: true, items: [] });
    if (path === "/api/workspace-agentos") return json(route, { ok: true, rows: [], actions: [] });
    if (path === "/api/workspace-deployment-budget") return json(route, { ok: true, projects: [], summary: {} });
    if (path === "/api/workspace-network") return json(route, { ok: true, relationships: [] });

    return json(route, { ok: true, rows: [], items: [], actions: [], evidence: [], products: [] });
  });
}

async function assertNoOverflow(page, name, scope = "page") {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 2) throw new Error(`${name}: ${scope} horizontal overflow ${overflow}px`);
}

async function assertTapTarget(locator, name) {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error(`${name}: target not visible`);
  if (rect.height < 40 || rect.width < 40) {
    throw new Error(`${name}: tap target too small (${Math.round(rect.width)}x${Math.round(rect.height)})`);
  }
}

for (const vp of viewports) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  const errors = [];
  const submitted = [];
  page.on("pageerror", error => errors.push(String(error)));
  await installMocks(page, submitted);

  await page.goto("https://ashwood-info.vercel.app/workspace/#operator", { waitUntil: "networkidle" });
  await page.locator("#operator").waitFor({ state: "visible" });
  await assertNoOverflow(page, vp.name, "Workspace");

  const operatorNav = page.locator('[data-workspace-nav="operator"]:visible').last();
  const buildNav = page.locator('[data-workspace-nav="build"]:visible').last();
  await assertTapTarget(operatorNav, `${vp.name} Operator nav`);
  await assertTapTarget(buildNav, `${vp.name} Build nav`);

  const commandInput = page.locator("#today-command-input");
  const sendButton = page.locator("#today-command-form button[type=submit]");
  await commandInput.fill("Mobile proof request");
  await assertTapTarget(sendButton, `${vp.name} Operator send`);
  await sendButton.click();
  await page.waitForTimeout(300);
  if (!submitted.some(body => body.action === "submit_command")) {
    throw new Error(`${vp.name}: Operator did not submit through durable ingress`);
  }

  const decision = page.locator('[data-owner-decision="accept"]');
  await decision.waitFor({ state: "visible" });
  await assertTapTarget(decision, `${vp.name} owner decision`);
  await decision.click();
  await page.waitForTimeout(250);
  if (!submitted.some(body => body.action === "submit_owner_decision")) {
    throw new Error(`${vp.name}: owner decision did not use governed ingress`);
  }

  await buildNav.click();
  await page.waitForTimeout(150);
  const sandboxLink = page.locator('a.sandbox-primary-link[href="https://mighty-yoga-pgph.here.now/"]');
  await sandboxLink.waitFor({ state: "visible" });
  await assertTapTarget(sandboxLink, `${vp.name} Open Sandbox`);
  await assertNoOverflow(page, vp.name, "Build");

  await page.screenshot({ path: `${OUT}/${vp.name}-workspace.png`, fullPage: true });

  await page.goto("https://ashwood-info.vercel.app/workspace/sandbox/", { waitUntil: "domcontentloaded" });
  await page.locator("#sandbox-frame").waitFor({ state: "visible" });
  await page.waitForTimeout(900);
  await assertNoOverflow(page, vp.name, "Sandbox Studio");

  const openExternal = page.locator("#sandbox-open-external");
  const requestButton = page.locator("#sandbox-request-form button[type=submit]");
  await assertTapTarget(openExternal, `${vp.name} Sandbox external link`);
  await assertTapTarget(requestButton, `${vp.name} Sandbox request button`);

  const reviewCount = await page.locator(".sandbox-review-item").count();
  const changes = await page.locator(".sandbox-change-card").count();
  if (reviewCount < 6) throw new Error(`${vp.name}: review checklist incomplete (${reviewCount})`);
  if (changes < 3) throw new Error(`${vp.name}: change overlay list incomplete (${changes})`);

  await page.locator(".sandbox-change-card").first().click();
  await page.locator("#sandbox-request-text").fill("Mobile QA: keep this correction inside the sandbox workflow.");
  await requestButton.click();
  await page.waitForFunction(() => document.querySelector("#sandbox-request-status")?.textContent?.includes("Queued"));
  if (!submitted.some(body => body.action === "submit_sandbox_change_request")) {
    throw new Error(`${vp.name}: Sandbox Studio change request did not use Operator ingress`);
  }

  await page.screenshot({ path: `${OUT}/${vp.name}-sandbox-studio.png`, fullPage: true });

  if (errors.length) throw new Error(`${vp.name}: page errors: ${errors.join(" | ")}`);
  console.log(JSON.stringify({ viewport: vp, workspace: "PASS", sandboxStudio: "PASS", submissions: submitted.map(x => x.action) }));

  await browser.close();
}
