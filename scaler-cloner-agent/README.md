# Scaler Website Cloner Agent (CLI)

A conversational terminal-based agent that uses Groq (OpenAI-compatible API) to reason in a strict loop (START → THINK → TOOL → … → OUTPUT) and generate real output files.

This project’s primary task is to **clone the Scaler Academy page** by generating a self-contained HTML/CSS/JS page that visually resembles **scaler.com/academy** (Header + Hero + Footer).

## Setup

1) Install dependencies:

```bash
npm install
```

2) Create your env file:

```bash
copy .env.example .env
```

3) Get a free Groq API key from https://console.groq.com and paste it into `.env`:

```env
GROQ_API_KEY=your_key_here
```

4) Run the agent:

```bash
node index.js
```

## Example usage

When you see the prompt, type:

```
Clone the Scaler Academy website
```

## How it works (simple)

- You type an instruction.
- The agent LLM responds with **single-line JSON** describing one step:
  - `START` (summarize)
  - `THINK` (reason)
  - `TOOL` (call exactly one tool)
  - `OUTPUT` (finish with a summary)
- The CLI executes the tools (defined in `index.js`), prints an OBSERVE result, and feeds that result back to the model.
- The page HTML is generated/modified by the LLM via the `generateScalerHTML({ instruction, currentHtml })` tool.

## Output

- The agent writes the clone to:
  - `scaler_clone/index.html`

Open it in any browser.

## Iterating (the "agent loop")

After the first clone, you can keep chatting to change the page. For example:

```
Attach this YouTube video in the AI SHIFT section and make it responsive
```

The agent should read the current HTML, regenerate an updated HTML file, and write it back.
