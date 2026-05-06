import readline from "readline";
import "dotenv/config";
import OpenAI from "openai";

import fs from "fs";
import path from "path";

function resolveFromRoot(p) {
  return path.resolve(process.cwd(), p);
}

function createFolder(folderPath) {
  const abs = resolveFromRoot(folderPath);
  fs.mkdirSync(abs, { recursive: true });
  return `Folder created: ${folderPath}`;
}

function createFile(filePath, content) {
  const abs = resolveFromRoot(filePath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, "utf8");
  return `File created: ${filePath}`;
}

function readFile(filePath) {
  const abs = resolveFromRoot(filePath);
  return fs.readFileSync(abs, "utf8");
}

function listFiles(folderPath) {
  const abs = resolveFromRoot(folderPath);
  const files = fs.readdirSync(abs);
  return files.join(", ");
}

function stripCodeFences(s) {
  if (typeof s !== "string") return "";
  const trimmed = s.trim();
  if (!trimmed.includes("```")) return trimmed;
  return trimmed.replace(/```[a-zA-Z]*\n?/g, "").replace(/```/g, "").trim();
}

function extractHtmlDocument(s) {
  const text = stripCodeFences(s);
  const idx = text.toLowerCase().indexOf("<!doctype html");
  if (idx >= 0) return text.slice(idx).trim();
  const htmlIdx = text.toLowerCase().indexOf("<html");
  if (htmlIdx >= 0) return "<!doctype html>\n" + text.slice(htmlIdx).trim();
  return text;
}

async function generateScalerHTML(toolInput = {}) {
  const instruction =
    typeof toolInput?.instruction === "string" && toolInput.instruction.trim()
      ? toolInput.instruction.trim()
      : "Clone a Scaler Academy-style landing page (sticky header, blue hero, highlight cards, AI SHIFT section with video, who-it-is-for section, and footer/help bar).";

  const currentHtml =
    typeof toolInput?.currentHtml === "string" && toolInput.currentHtml.trim() ? toolInput.currentHtml.trim() : "";

  if (!process.env.GROQ_API_KEY) {
    throw new Error("Missing GROQ_API_KEY. Add it to .env before generating HTML.");
  }

  const htmlClient = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });

  const model = process.env.GROQ_HTML_MODEL || "llama-3.1-8b-instant";

  const system = [
    "You are a senior frontend engineer.",
    "Return ONLY a complete, standalone HTML document (no markdown, no explanations).",
    "Use inline <style> and <script> (no external JS/CSS), except Google Fonts for Inter.",
    "The output must visually resemble a Scaler Academy-style landing page.",
    "Must include: sticky header with logo + nav + CTA, blue gradient hero with 2 CTA buttons, a 3-card highlights row, an 'AI SHIFT' section, a 'WHO IT IS FOR' section, and a footer/help bar.",
    "Use modern layout: centered container, generous whitespace, bold typography (Inter), subtle borders, and soft shadows.",
    "Use semantic HTML and make it responsive.",
    "Avoid external images; use placeholders (CSS shapes) if needed.",
    "Do not include multiple HTML documents.",
  ].join("\n");

  const user = [
    `Instruction:\n${instruction}`,
    currentHtml
      ? `\nCurrent HTML (modify this to satisfy the instruction; keep structure unless instruction requires change):\n${currentHtml}`
      : "\nNo current HTML provided. Generate a fresh page.",
    "\nOutput requirements:",
    "- Single HTML file that runs in a browser",
    "- Sections: Header, Hero, Highlights cards, AI SHIFT (with video embed), WHO IT IS FOR, Footer + help bar",
    "- Uses Inter font",
    "- Keep the hero background light/blue (not dark/grey)",
  ].join("\n");

  const response = await htmlClient.chat.completions.create({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.2,
    max_tokens: 4096,
  });

  const raw = (response.choices?.[0]?.message?.content ?? "").trim();
  const html = extractHtmlDocument(raw);

  if (!html.toLowerCase().includes("<html") || !html.toLowerCase().includes("</html>")) {
    throw new Error("Model did not return a valid HTML document.");
  }

  return html;
}

const tool_map = {
  createFolder,
  createFile,
  readFile,
  listFiles,
  generateScalerHTML,
};

const tools_description = `
1) createFolder(folderPath): Creates a directory at the given path (relative to project root) using fs.mkdirSync({ recursive: true }). Returns: "Folder created: <folderPath>".
2) createFile(filePath, content): Creates a file at the given path, writing the provided content using fs.writeFileSync. Creates parent directories as needed using fs.mkdirSync({ recursive: true }) on the dirname. Returns: "File created: <filePath>".
3) readFile(filePath): Reads and returns the content of a file using fs.readFileSync. Returns the file content as a string.
4) listFiles(folderPath): Lists all files in a directory using fs.readdirSync. Returns a comma-separated string of filenames.
5) generateScalerHTML({ instruction, currentHtml }): Uses the Groq LLM to generate (or modify) a complete, self-contained HTML document (inline CSS + JS, Inter font). Returns the HTML as a string.
`.trim();

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const MODEL = process.env.GROQ_AGENT_MODEL || "llama-3.1-8b-instant";

async function callWithRetry(messages, systemPrompt, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: MODEL,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        max_tokens: 1024,
        temperature: 0.2,
      });
      return response;
    } catch (err) {
      const is429 = err?.status === 429 || err?.message?.includes("429");
      if (is429 && attempt < retries) {
        const waitMs = 15000 * attempt; // 15s, then 30s
        console.log(
          `⏳ Rate limit hit. Waiting ${waitMs / 1000}s before retry (attempt ${attempt}/${retries})...`
        );
        await new Promise((res) => setTimeout(res, waitMs));
      } else {
        throw err;
      }
    }
  }
}

const systemPrompt = [
  "You are an expert web developer AI agent. You work in a strict reasoning loop: START → THINK → TOOL (repeat as needed) → OUTPUT.",
  "Every single response you give must be one valid JSON object on a single line, in this exact format:",
  '{ "step": "START|THINK|TOOL|OUTPUT", "content": "...", "tool_name": "...(only for TOOL step)", "tool_input": {...(only for TOOL step)} }',
  "Rules:",
  "- Always begin with a START step summarizing the user's task.",
  "- Do at least 2 THINK steps before calling any tool.",
  "- Use TOOL steps to take actions — only one tool call per response.",
  "- After each TOOL call, you will receive an OBSERVE message. Read it, then continue thinking or call the next tool.",
  "- When the task is fully complete, emit an OUTPUT step with a friendly summary.",
  "- Never skip steps. Never combine two steps into one response.",
  "- Output raw JSON only — no markdown, no backticks, no text outside the JSON object.",
  "",
  "Available Tools:",
  tools_description,
  "",
  "General guidance:",
  "- Your job is to generate or modify a working Scaler-like landing page as requested.",
  "- Prefer iterating: create folder → read existing HTML (if any) → generate new HTML → write file → optionally re-read to verify.",
  "- To generate HTML, call generateScalerHTML with tool_input = { instruction: <user request>, currentHtml?: <existing html> }.",
  "- To modify an existing page, first readFile('scaler_clone/index.html') and pass it as currentHtml to generateScalerHTML.",
  "- Always ensure output includes Header, Hero section, and Footer.",
].join("\n");

function printBanner() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║   🤖  Scaler Website Cloner Agent        ║");
  console.log("║   Powered by Groq + LLaMA 3.3           ║");
  console.log("║   Type your instruction and press Enter  ║");
  console.log("╚══════════════════════════════════════════╝");
}

function truncateForConsole(value, maxLen = 80) {
  const s = typeof value === "string" ? value : JSON.stringify(value);
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen - 1) + "…";
}

function extractJsonObjects(raw) {
  if (typeof raw !== "string") return [];

  const objects = [];
  let cursor = 0;

  while (cursor < raw.length) {
    const start = raw.indexOf("{", cursor);
    if (start === -1) break;

    let depth = 0;
    let inString = false;
    let escaping = false;
    let end = -1;

    for (let i = start; i < raw.length; i++) {
      const ch = raw[i];

      if (inString) {
        if (escaping) {
          escaping = false;
        } else if (ch === "\\") {
          escaping = true;
        } else if (ch === '"') {
          inString = false;
        }
        continue;
      }

      if (ch === '"') {
        inString = true;
        continue;
      }

      if (ch === "{") depth += 1;
      if (ch === "}") depth -= 1;

      if (depth === 0) {
        end = i;
        break;
      }
    }

    if (end !== -1) {
      objects.push(raw.slice(start, end + 1).trim());
      cursor = end + 1;
    } else {
      break;
    }
  }

  return objects;
}

function getLatestUserInstruction(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (!msg || msg.role !== "user") continue;
    const content = typeof msg.content === "string" ? msg.content.trim() : "";
    if (!content) continue;

    // Skip OBSERVE payloads we inject back into the model
    if (content.startsWith("{") && content.includes('"step"')) {
      try {
        const parsed = JSON.parse(content);
        if (parsed?.step === "OBSERVE") continue;
      } catch {
        // Not JSON; treat as user instruction
      }
    }

    return content;
  }
  return "";
}

async function runAgentLoop(messages) {
  let iterations = 0;

  while (iterations < 20) {
    iterations += 1;

    await new Promise((res) => setTimeout(res, 1500)); // 1.5s pause between steps

    const response = await callWithRetry(messages, systemPrompt);

    const rawContent = (response.choices?.[0]?.message?.content ?? "").trim();
    messages.push({ role: "assistant", content: rawContent });

    const parsedObjects = [];
    try {
      parsedObjects.push(JSON.parse(rawContent));
    } catch {
      const jsonChunks = extractJsonObjects(rawContent);
      for (const chunk of jsonChunks) {
        try {
          parsedObjects.push(JSON.parse(chunk));
        } catch {
          // ignore non-JSON or malformed chunks
        }
      }
    }

    if (parsedObjects.length === 0) {
      console.log(`\n[RAW] ${rawContent}`);
      continue;
    }

    let executedTool = false;

    for (const parsed of parsedObjects) {
      if (!parsed || typeof parsed !== "object") continue;

      if (parsed.step === "START") {
        console.log(`\n🚀 [START] ${parsed.content ?? ""}`);
        continue;
      }

      if (parsed.step === "THINK") {
        console.log(`💭 [THINK] ${parsed.content ?? ""}`);
        continue;
      }

      if (parsed.step === "TOOL") {
        const toolName = parsed.tool_name;
        const toolInput = parsed.tool_input ?? {};

        console.log(`🔧 [TOOL] Calling: ${toolName}`);
        console.log(`   Args: ${JSON.stringify(toolInput, null, 2)}`);

        let result;
        try {
          if (!tool_map[toolName]) {
            result = `Error: tool ${toolName} not found`;
          } else if (toolName === "createFolder") {
            result = tool_map.createFolder(toolInput.folderPath);
          } else if (toolName === "createFile") {
            let content = toolInput.content;
            const filePath = String(toolInput.filePath ?? "").replaceAll("\\", "/");
            const isTargetHtml = filePath === "scaler_clone/index.html";
            const hasStoredHtml = typeof globalThis._lastGeneratedHTML === "string" && globalThis._lastGeneratedHTML.length > 0;

            // If LLM used the placeholder (or a truncated "..."), substitute the real HTML
            const looksPlaceholderish =
              content === "[USE_GENERATED_HTML]" ||
              content?.includes("USE_GENERATED_HTML") ||
              content?.includes("...") ||
              content?.includes("…") ||
              (typeof content === "string" && content.startsWith("<!") && content.length < 2000);

            if (isTargetHtml && hasStoredHtml && looksPlaceholderish) {
              content = globalThis._lastGeneratedHTML;
            }
            result = tool_map.createFile(toolInput.filePath, content);
          } else if (toolName === "readFile") {
            result = tool_map.readFile(toolInput.filePath);
          } else if (toolName === "listFiles") {
            result = tool_map.listFiles(toolInput.folderPath);
          } else if (toolName === "generateScalerHTML") {
            const enriched = { ...toolInput };

            if (typeof enriched.instruction !== "string" || !enriched.instruction.trim()) {
              enriched.instruction = getLatestUserInstruction(messages);
            }

            if (typeof enriched.currentHtml !== "string" || !enriched.currentHtml.trim()) {
              try {
                enriched.currentHtml = tool_map.readFile("scaler_clone/index.html");
              } catch {
                // No existing file yet; generate from scratch
              }
            }

            result = await tool_map.generateScalerHTML(enriched);
          } else {
            result = `Error: tool ${toolName} not supported by dispatcher`;
          }
        } catch (err) {
          result = `Error: ${err?.message ?? String(err)}`;
        }

        const observeForConsole =
          toolName === "generateScalerHTML" ? truncateForConsole(result, 80) : truncateForConsole(result, 200);

        console.log(`📋 [OBSERVE] ${observeForConsole}`);

        if (parsed.tool_name === "generateScalerHTML") {
          // Store full HTML separately for use in createFile
          globalThis._lastGeneratedHTML = result;

          // Push only a short summary into messages (saves tokens)
          messages.push({
            role: "user",
            content: JSON.stringify({
              step: "OBSERVE",
              content:
                "HTML successfully generated. It is stored and ready. Now call createFile with filePath = 'scaler_clone/index.html' and content = '[USE_GENERATED_HTML]' as a placeholder — the system will substitute the real HTML automatically.",
            }),
          });
        } else {
          // Normal OBSERVE for all other tools
          messages.push({ role: "user", content: JSON.stringify({ step: "OBSERVE", content: result }) });
        }

        executedTool = true;
        break; // execute at most one tool per model response
      }

      if (parsed.step === "OUTPUT") {
        console.log(`\n✅ [DONE] ${parsed.content ?? ""}\n`);
        return;
      }
    }

    if (!executedTool) {
      // No tool executed; ask the model again for the next step.
      continue;
    }
  }

  console.log("\n⚠️  [WARN] Safety stop: exceeded 20 iterations without an OUTPUT step.");
}

async function main() {
  if (!process.env.GROQ_API_KEY) {
    console.log("Missing GROQ_API_KEY. Add it to .env (copy .env.example to .env).\n");
    process.exit(1);
  }

  printBanner();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  const messages = [];

  const ask = () => {
    rl.question("\nYou > ", async (userInput) => {
      const trimmed = (userInput ?? "").trim();
      if (!trimmed) return ask();

      messages.push({ role: "user", content: trimmed });

      try {
        await runAgentLoop(messages);
      } catch (err) {
        console.log(`\n⚠️  Agent error: ${err?.message ?? String(err)}`);
      }

      ask();
    });
  };

  ask();
}

main();
