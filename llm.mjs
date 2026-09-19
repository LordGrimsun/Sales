// Unified LLM provider client: Anthropic, OpenAI, Gemini, OpenRouter, and local Claude CLI.
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const CLI_CWD = path.join(os.tmpdir(), 'agents-office-cli');

// Automatically read local .env if present
try {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq > 0) {
        const k = trimmed.slice(0, eq).trim();
        const v = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
        if (k && v && !process.env[k]) {
          process.env[k] = v;
        }
      }
    }
  }
} catch {}

export function detectProvider() {
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.OPENROUTER_API_KEY) return 'openrouter';
  return 'claude-cli';
}

export function getProviderInfo() {
  const provider = detectProvider();
  return {
    provider,
    isConfigured: provider !== 'claude-cli' || hasClaudeCli(),
    defaultModel: provider === 'anthropic' ? 'claude-3-5-sonnet-20241022'
      : provider === 'openai' ? 'gpt-4o'
      : provider === 'gemini' ? 'gemini-2.0-flash'
      : provider === 'openrouter' ? 'anthropic/claude-3.5-sonnet'
      : 'sonnet'
  };
}

function hasClaudeCli() {
  // on serverless / Vercel, CLI is never available
  if (process.env.VERCEL) return false;
  return true;
}

export async function askLLM(system, user, opts = {}) {
  const {
    maxTokens = 4000,
    model = '',
    temperature = 0.7,
    mcpTools = [],
    cliArgs = []
  } = opts;

  // 1. Anthropic API
  if (process.env.ANTHROPIC_API_KEY) {
    const chosenModel = model.includes('opus') ? 'claude-3-opus-20240229'
      : model.includes('haiku') ? 'claude-3-5-haiku-20241022'
      : 'claude-3-5-sonnet-20241022';

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: chosenModel,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const text = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n')
      .trim();

    return {
      text,
      tools: [],
      usage: data.usage || null,
      modelId: data.model || chosenModel,
    };
  }

  // 2. OpenAI API
  if (process.env.OPENAI_API_KEY) {
    const chosenModel = model.includes('mini') ? 'gpt-4o-mini'
      : model.includes('o3') ? 'o3-mini'
      : 'gpt-4o';

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: chosenModel,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() || '';
    return {
      text,
      tools: [],
      usage: data.usage || null,
      modelId: data.model || chosenModel,
    };
  }

  // 3. Gemini API (via OpenAI compatible endpoint)
  if (process.env.GEMINI_API_KEY) {
    const chosenModel = 'gemini-2.0-flash';
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: chosenModel,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() || '';
    return {
      text,
      tools: [],
      usage: data.usage || null,
      modelId: chosenModel,
    };
  }

  // 4. OpenRouter API
  if (process.env.OPENROUTER_API_KEY) {
    const chosenModel = 'anthropic/claude-3.5-sonnet';
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: chosenModel,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenRouter API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() || '';
    return {
      text,
      tools: [],
      usage: data.usage || null,
      modelId: chosenModel,
    };
  }

  // 5. Local Claude CLI (only when running locally outside Vercel)
  if (!process.env.VERCEL) {
    fs.mkdirSync(CLI_CWD, { recursive: true });
    const allowed = mcpTools || [];
    const args = [
      '-p', user,
      '--output-format', 'stream-json',
      '--verbose',
      '--no-session-persistence',
      '--system-prompt', system,
      '--disallowedTools', 'Bash,Edit,Write,Read,Glob,Grep,Agent,NotebookEdit,Task' + (allowed.includes('WebFetch') ? '' : ',WebFetch,WebSearch'),
    ];
    if (allowed.length) args.push('--allowedTools', allowed.join(','));
    if (cliArgs.length) args.push(...cliArgs);

    const env = { ...process.env };
    delete env.CLAUDECODE;

    const cmd = process.platform === 'win32' ? 'claude.cmd' : 'claude';
    return new Promise((resolve, reject) => {
      let p;
      try {
        p = spawn(cmd, args, { cwd: CLI_CWD, env, stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32' });
      } catch (err) {
        return reject(new Error('Claude Code CLI not found. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY.'));
      }

      let out = '', err = '', text = '', used = [], gotResult = false, usageOut = null, modelUsed = null;
      const timeout = 120000;
      const timer = setTimeout(() => {
        try { p.kill('SIGKILL'); } catch {}
        reject(new Error('Claude CLI request timed out'));
      }, timeout);

      const feed = line => {
        if (!line.trim()) return;
        let j; try { j = JSON.parse(line); } catch { return; }
        if (j.type === 'assistant' && j.message?.content) {
          for (const b of j.message.content) {
            if (b.type === 'tool_use' && b.name && !used.includes(b.name)) used.push(b.name);
          }
        }
        if (j.type === 'result') {
          gotResult = true;
          text = String(j.result || '').trim();
          usageOut = j.usage || null;
        }
      };

      p.stdout.on('data', d => {
        out += d;
        let i;
        while ((i = out.indexOf('\n')) >= 0) {
          feed(out.slice(0, i));
          out = out.slice(i + 1);
        }
      });
      p.stderr.on('data', d => { err += d; });
      p.on('error', e => {
        clearTimeout(timer);
        reject(new Error(e.code === 'ENOENT' ? 'Claude CLI is not installed on PATH. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY.' : e.message));
      });
      p.on('close', code => {
        clearTimeout(timer);
        feed(out);
        if (code !== 0 && !gotResult) {
          return reject(new Error(`claude exited with code ${code}: ${err.trim().slice(0, 200)}`));
        }
        if (!gotResult) {
          try { text = String(JSON.parse(out).result || '').trim(); } catch { text = out.trim(); }
        }
        resolve({ text, tools: used, usage: usageOut, modelId: modelUsed || 'claude-cli' });
      });
    });
  }

  throw new Error('No AI provider configured on Vercel. Please set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY in your Vercel project Environment Variables.');
}
