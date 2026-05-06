import fs from "fs";
import path from "path";

function resolveFromRoot(p) {
  return path.resolve(process.cwd(), p);
}

export function createFolder(folderPath) {
  const abs = resolveFromRoot(folderPath);
  fs.mkdirSync(abs, { recursive: true });
  return `Folder created: ${folderPath}`;
}

export function createFile(filePath, content) {
  const abs = resolveFromRoot(filePath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, "utf8");
  return `File created: ${filePath}`;
}

export function readFile(filePath) {
  const abs = resolveFromRoot(filePath);
  return fs.readFileSync(abs, "utf8");
}

export function listFiles(folderPath) {
  const abs = resolveFromRoot(folderPath);
  const files = fs.readdirSync(abs);
  return files.join(", ");
}

export function generateScalerHTML() {
  // Hardcoded self-contained HTML (inline CSS + JS). Only external dependency is Google Fonts.
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Scaler Academy — Program Overview (Clone)</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <style>
      :root {
        --bg: #0a0a0a;
        --bg2: #0d0d0d;
        --card: rgba(255, 255, 255, 0.06);
        --card2: rgba(255, 255, 255, 0.08);
        --text: #f5f7fb;
        --muted: rgba(245, 247, 251, 0.72);
        --muted2: rgba(245, 247, 251, 0.58);
        --border: rgba(255, 255, 255, 0.10);
        --border2: rgba(255, 255, 255, 0.14);
        --orange1: #ff6b35;
        --orange2: #e85d26;
        --glow1: rgba(124, 58, 237, 0.22);
        --glow2: rgba(59, 130, 246, 0.16);
      }

      * { box-sizing: border-box; }
      html, body { height: 100%; }
      body {
        margin: 0;
        font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        background: var(--bg);
        color: var(--text);
      }
      a { color: inherit; text-decoration: none; }

      .container {
        width: min(1180px, calc(100% - 40px));
        margin: 0 auto;
      }

      /* Header */
      .header {
        position: sticky;
        top: 0;
        z-index: 1000;
        background: #0a0a0a;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(10px);
      }
      .header-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 0;
        gap: 16px;
      }
      .brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-weight: 800;
        letter-spacing: -0.02em;
      }
      .brand .icon {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        display: grid;
        place-items: center;
        background: linear-gradient(135deg, rgba(255, 107, 53, 0.95), rgba(232, 93, 38, 0.85));
        color: #fff;
        font-weight: 900;
      }
      .brand .text {
        font-size: 18px;
        color: #fff;
      }

      .nav {
        display: flex;
        align-items: center;
        gap: 20px;
      }
      .nav a {
        color: rgba(255, 255, 255, 0.68);
        font-weight: 600;
        font-size: 14px;
        padding: 8px 6px;
      }
      .nav a:hover { color: #fff; }

      .actions {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 10px 14px;
        border-radius: 999px;
        font-weight: 700;
        font-size: 14px;
        border: 1px solid transparent;
        cursor: pointer;
        user-select: none;
      }
      .btn.primary {
        background: linear-gradient(135deg, var(--orange1), var(--orange2));
        color: #fff;
        box-shadow: 0 10px 30px rgba(255, 107, 53, 0.16);
      }
      .btn.primary:hover { filter: brightness(1.04); }
      .btn.outline {
        background: transparent;
        border-color: rgba(255, 255, 255, 0.22);
        color: #fff;
      }
      .btn.outline:hover { border-color: rgba(255, 255, 255, 0.35); }

      .hamburger {
        display: none;
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.10);
        color: #fff;
        cursor: pointer;
      }

      /* Mobile nav */
      .mobile-panel {
        display: none;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        background: #0a0a0a;
      }
      .mobile-panel.open { display: block; }
      .mobile-panel .container {
        padding: 12px 0 18px;
      }
      .mobile-links {
        display: grid;
        gap: 8px;
      }
      .mobile-links a {
        padding: 10px 12px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.78);
        font-weight: 600;
      }
      .mobile-links a:hover { color: #fff; border-color: rgba(255, 255, 255, 0.16); }
      .mobile-actions { display: flex; gap: 10px; margin-top: 12px; }

      /* Hero */
      .hero {
        position: relative;
        overflow: hidden;
        padding: 64px 0 56px;
      }
      .hero::before {
        content: "";
        position: absolute;
        inset: -30% -20% auto -20%;
        height: 520px;
        background:
          radial-gradient(closest-side at 20% 30%, var(--glow1), transparent 70%),
          radial-gradient(closest-side at 70% 20%, var(--glow2), transparent 68%);
        pointer-events: none;
        filter: blur(2px);
      }
      .hero::after {
        content: "";
        position: absolute;
        inset: 0;
        background: radial-gradient(1200px 420px at 50% 0%, rgba(255, 255, 255, 0.03), transparent 70%);
        pointer-events: none;
      }

      .hero-grid {
        position: relative;
        display: grid;
        grid-template-columns: 1.25fr 0.95fr;
        gap: 28px;
        align-items: center;
      }

      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(255, 255, 255, 0.04);
        color: rgba(255, 255, 255, 0.78);
        font-weight: 600;
        font-size: 13px;
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(124, 58, 237, 0.95));
        box-shadow: 0 0 20px rgba(124, 58, 237, 0.35);
      }

      h1 {
        margin: 16px 0 12px;
        line-height: 1.08;
        letter-spacing: -0.035em;
        font-size: clamp(2rem, 5vw, 3.5rem);
        font-weight: 800;
      }
      .subtext {
        margin: 0 0 22px;
        color: var(--muted);
        font-size: 16px;
        line-height: 1.6;
        max-width: 56ch;
      }

      .cta-row {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        align-items: center;
        margin-bottom: 18px;
      }
      .btn.large { padding: 12px 16px; font-size: 14px; }

      .stats {
        display: flex;
        align-items: center;
        gap: 18px;
        flex-wrap: wrap;
        color: rgba(255, 255, 255, 0.78);
        margin-top: 10px;
      }
      .stat {
        display: flex;
        align-items: baseline;
        gap: 8px;
        font-weight: 700;
      }
      .stat small { font-weight: 600; color: rgba(255, 255, 255, 0.60); }
      .divider {
        width: 1px;
        height: 22px;
        background: rgba(255, 255, 255, 0.18);
      }

      /* Progress card */
      .card {
        border: 1px solid var(--border);
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.03));
        border-radius: 20px;
        padding: 18px;
        box-shadow: 0 18px 60px rgba(0, 0, 0, 0.35);
      }
      .card-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 14px;
        gap: 10px;
      }
      .card-title {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .card-title strong { font-size: 14px; }
      .card-title span { font-size: 12px; color: rgba(255, 255, 255, 0.65); }

      .pill {
        font-size: 12px;
        font-weight: 700;
        padding: 7px 10px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: rgba(255, 255, 255, 0.82);
      }

      .module {
        padding: 12px;
        border-radius: 16px;
        background: rgba(0, 0, 0, 0.18);
        border: 1px solid rgba(255, 255, 255, 0.08);
        display: grid;
        gap: 8px;
      }
      .module + .module { margin-top: 10px; }

      .module-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .module-name {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 700;
        font-size: 13px;
      }
      .badge {
        width: 30px;
        height: 30px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
      }
      .module-meta { font-size: 12px; color: rgba(255, 255, 255, 0.62); }

      .bar {
        height: 10px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.10);
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.10);
      }
      .bar > i {
        display: block;
        height: 100%;
        width: 20%;
        border-radius: 999px;
        background: linear-gradient(90deg, rgba(59, 130, 246, 0.95), rgba(124, 58, 237, 0.95));
      }
      .bar.orange > i { background: linear-gradient(90deg, rgba(255, 107, 53, 0.95), rgba(232, 93, 38, 0.95)); }
      .bar.green > i { background: linear-gradient(90deg, rgba(34, 197, 94, 0.95), rgba(16, 185, 129, 0.95)); }

      /* Footer */
      footer {
        background: var(--bg2);
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        margin-top: 40px;
      }
      .footer-grid {
        display: grid;
        grid-template-columns: 1.2fr 1fr 1fr 1fr;
        gap: 22px;
        padding: 34px 0;
      }
      .footer-col h4 {
        margin: 0 0 12px;
        font-size: 13px;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.75);
      }
      .footer-col a, .footer-col div {
        display: block;
        padding: 6px 0;
        color: rgba(255, 255, 255, 0.66);
        font-weight: 600;
        font-size: 14px;
      }
      .footer-col a:hover { color: rgba(255, 255, 255, 0.92); }

      .tagline {
        margin-top: 10px;
        color: rgba(255, 255, 255, 0.68);
        line-height: 1.6;
        font-size: 14px;
        font-weight: 600;
      }

      .social {
        display: flex;
        gap: 10px;
        margin-top: 10px;
      }
      .social a {
        width: 38px;
        height: 38px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.10);
        color: rgba(255, 255, 255, 0.78);
        font-weight: 800;
      }
      .social a:hover { color: #fff; border-color: rgba(255, 255, 255, 0.18); }

      .bottom-bar {
        border-top: 1px solid rgba(255, 255, 255, 0.10);
        padding: 14px 0;
        text-align: center;
        color: rgba(255, 255, 255, 0.62);
        font-weight: 600;
        font-size: 13px;
      }

      /* Responsive */
      @media (max-width: 980px) {
        .hero { padding: 52px 0 44px; }
        .hero-grid { grid-template-columns: 1fr; }
        .subtext { max-width: none; }
      }

      @media (max-width: 860px) {
        .nav { display: none; }
        .hamburger { display: inline-grid; place-items: center; }
        .actions .btn.primary { display: none; } /* hamburger hint: primary action in panel */
      }

      @media (max-width: 840px) {
        .footer-grid { grid-template-columns: 1fr 1fr; }
      }

      @media (max-width: 520px) {
        .container { width: calc(100% - 28px); }
        .footer-grid { grid-template-columns: 1fr; }
        .stats { gap: 12px; }
        .divider { display: none; }
      }

      /* Small polish */
      .kbd {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        background: rgba(255, 255, 255, 0.06);
        color: rgba(255, 255, 255, 0.82);
      }
    </style>
  </head>
  <body>
    <header class="header">
      <div class="container header-inner">
        <a class="brand" href="#top" aria-label="Scaler Home">
          <span class="icon">S</span>
          <span class="text">Scaler</span>
        </a>

        <nav class="nav" aria-label="Primary">
          <a href="#courses">Courses</a>
          <a href="#mentors">Mentors</a>
          <a href="#placements">Placements</a>
          <a href="#reviews">Reviews</a>
          <a href="#blog">Blog</a>
        </nav>

        <div class="actions">
          <button class="hamburger" id="hamburger" aria-label="Open menu" aria-expanded="false">
            ☰
          </button>
          <a class="btn primary" href="#apply">Apply Now</a>
        </div>
      </div>

      <div class="mobile-panel" id="mobilePanel" aria-hidden="true">
        <div class="container">
          <div class="mobile-links">
            <a href="#courses">Courses</a>
            <a href="#mentors">Mentors</a>
            <a href="#placements">Placements</a>
            <a href="#reviews">Reviews</a>
            <a href="#blog">Blog</a>
          </div>
          <div class="mobile-actions">
            <a class="btn primary" style="flex: 1" href="#apply">Apply Now</a>
            <a class="btn outline" style="flex: 1" href="#curriculum">View Curriculum</a>
          </div>
        </div>
      </div>
    </header>

    <main id="top">
      <section class="hero">
        <div class="container hero-grid">
          <div>
            <div class="eyebrow"><span class="dot"></span> AI-integrated curriculum · Mentorship · Placement support <span class="kbd">2026</span></div>
            <h1>Master DSA, System Design &amp; AI Engineering</h1>
            <p class="subtext">
              12-month AI-integrated program. Real projects. Placement support. Mentored by engineers from Google, Amazon &amp; Meta.
            </p>

            <div class="cta-row" id="apply">
              <a class="btn primary large" href="#apply">Apply Now</a>
              <a class="btn outline large" id="curriculum" href="#courses">View Curriculum</a>
            </div>

            <div class="stats" aria-label="Program stats">
              <div class="stat"><span>1,00,000+</span> <small>Alumni</small></div>
              <div class="divider" aria-hidden="true"></div>
              <div class="stat"><span>900+</span> <small>Hiring Partners</small></div>
              <div class="divider" aria-hidden="true"></div>
              <div class="stat"><span>2x</span> <small>Avg Salary Hike</small></div>
            </div>
          </div>

          <aside class="card" aria-label="Your Progress">
            <div class="card-top">
              <div class="card-title">
                <strong>Your Progress</strong>
                <span>Track modules · mock UI</span>
              </div>
              <span class="pill">Week 8</span>
            </div>

            <div class="module">
              <div class="module-head">
                <div class="module-name"><span class="badge">📘</span> DSA Foundations</div>
                <div class="module-meta">72%</div>
              </div>
              <div class="bar"><i style="width:72%"></i></div>
            </div>

            <div class="module">
              <div class="module-head">
                <div class="module-name"><span class="badge">🧩</span> System Design</div>
                <div class="module-meta">44%</div>
              </div>
              <div class="bar orange"><i style="width:44%"></i></div>
            </div>

            <div class="module">
              <div class="module-head">
                <div class="module-name"><span class="badge">🧪</span> Full Stack</div>
                <div class="module-meta">31%</div>
              </div>
              <div class="bar green"><i style="width:31%"></i></div>
            </div>
          </aside>
        </div>
      </section>

      <section class="container" style="padding: 8px 0 0;">
        <div class="card" style="padding: 16px 18px;">
          <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; align-items:center;">
            <div style="font-weight:800; letter-spacing:-0.02em;">Preview sections</div>
            <div style="color: rgba(255,255,255,0.66); font-weight:600;">Header · Hero · Footer (responsive)</div>
          </div>
          <div style="margin-top:10px; color: rgba(255,255,255,0.62); font-weight:600; line-height:1.6;">
            This is a simplified, self-contained clone-style page generated by the CLI agent.
          </div>
        </div>
      </section>
    </main>

    <footer>
      <div class="container footer-grid">
        <div class="footer-col">
          <a class="brand" href="#top" style="gap:10px;">
            <span class="icon">S</span>
            <span class="text">Scaler</span>
          </a>
          <div class="tagline">Transforming careers since 2019</div>
          <div class="social" aria-label="Social links">
            <a href="#" aria-label="LinkedIn">⟨in⟩</a>
            <a href="#" aria-label="Twitter/X">𝕏</a>
            <a href="#" aria-label="YouTube">▶</a>
          </div>
        </div>

        <div class="footer-col" id="courses">
          <h4>Courses</h4>
          <a href="#">DSA &amp; Algorithms</a>
          <a href="#">System Design</a>
          <a href="#">Full Stack Dev</a>
          <a href="#">Data Science</a>
        </div>

        <div class="footer-col" id="blog">
          <h4>Company</h4>
          <a href="#">About Us</a>
          <a href="#">Careers</a>
          <a href="#">Blog</a>
          <a href="#">Press</a>
        </div>

        <div class="footer-col" id="mentors">
          <h4>Contact</h4>
          <div>hello@scaler.com</div>
          <div style="padding-top: 10px; color: rgba(255,255,255,0.58); font-weight:600;">Mon–Sat · 9AM–9PM</div>
        </div>
      </div>

      <div class="bottom-bar">© 2025 Scaler Academy. All rights reserved.</div>
    </footer>

    <script>
      (function () {
        const btn = document.getElementById("hamburger");
        const panel = document.getElementById("mobilePanel");
        if (!btn || !panel) return;

        function setOpen(next) {
          panel.classList.toggle("open", next);
          btn.setAttribute("aria-expanded", String(next));
          panel.setAttribute("aria-hidden", String(!next));
        }

        btn.addEventListener("click", () => {
          const isOpen = panel.classList.contains("open");
          setOpen(!isOpen);
        });

        panel.addEventListener("click", (e) => {
          const target = e.target;
          if (target && target.tagName === "A") setOpen(false);
        });

        document.addEventListener("keydown", (e) => {
          if (e.key === "Escape") setOpen(false);
        });
      })();
    </script>
  </body>
</html>`;
}

export const tool_map = {
  createFolder,
  createFile,
  readFile,
  listFiles,
  generateScalerHTML,
};

export const tools_description = `
1) createFolder(folderPath): Creates a directory at the given path (relative to project root) using fs.mkdirSync({ recursive: true }). Returns: "Folder created: <folderPath>".
2) createFile(filePath, content): Creates a file at the given path, writing the provided content using fs.writeFileSync. Creates parent directories as needed using fs.mkdirSync({ recursive: true }) on the dirname. Returns: "File created: <filePath>".
3) readFile(filePath): Reads and returns the content of a file using fs.readFileSync. Returns the file content as a string.
4) listFiles(folderPath): Lists all files in a directory using fs.readdirSync. Returns a comma-separated string of filenames.
5) generateScalerHTML(): Returns a hardcoded, complete, self-contained HTML string (inline CSS + JS, only one Google Fonts link tag) that visually resembles the Scaler Academy website with a sticky header, hero section, and footer.
`.trim();
