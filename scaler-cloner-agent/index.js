import readline from "readline";
import "dotenv/config";
import OpenAI from "openai";

import { tool_map, tools_description } from "./tools.js";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const MODEL = "llama-3.1-8b-instant";

async function callWithRetry(messages, systemPrompt, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: "llama-3.1-8b-instant",
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
  "When the user asks to clone the Scaler website, follow this exact plan:",
  "",
  "THINK: identify what folder and file are needed",
  'TOOL: call createFolder with folderPath = "scaler_clone"',
  "TOOL: call generateScalerHTML (no arguments needed)",
  "TOOL: call createFile with the HTML content from the previous OBSERVE",
  'OUTPUT: tell the user to open scaler_clone/index.html in their browser',
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
            result = tool_map.generateScalerHTML();
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
