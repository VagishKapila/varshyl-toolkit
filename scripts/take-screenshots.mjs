import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? "http://localhost:4173";
const OUT_DIR = path.join(__dirname, "../apps/public-demo/dist/screenshots");

mkdirSync(OUT_DIR, { recursive: true });

const screens = [
  { route: "/auth",            name: "sign-in"         },
  { route: "/consent/signup",  name: "signup-consent"  },
  { route: "/auth/forgot",     name: "forgot-password" },
  { route: "/auth/reset",      name: "reset-password"  },
  { route: "/payments/paywall",name: "paywall"         },
  { route: "/payments/lapsed", name: "read-only-lapse" },
  { route: "/team/people",     name: "org-people-page" },
  { route: "/consent/welcome", name: "welcome-screen"  },
  { route: "/consent/empty",   name: "empty-state"     },
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

for (const { route, name } of screens) {
  await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle", timeout: 30000 });
  // Let React finish rendering / CSS transitions settle
  await page.waitForTimeout(600);
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`captured: ${name} -> ${file}`);
}

await browser.close();
console.log("Done. Screenshots in", OUT_DIR);

