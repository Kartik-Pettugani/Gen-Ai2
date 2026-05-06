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
- The LLM must respond with **single-line JSON** describing one step:
  - `START` (summarize)
  - `THINK` (reason)
  - `TOOL` (call exactly one tool)
  - `OUTPUT` (finish with a summary)
- The CLI executes tools from `tools.js`, prints an OBSERVE result, and feeds that result back to the model.

## Output

- The agent writes the clone to:
  - `scaler_clone/index.html`

Open it in any browser.
