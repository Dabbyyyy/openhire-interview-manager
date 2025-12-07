// src/lib/llm.js

const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};

// --- Config ---
const API_KEY = env.VITE_OPENAI_API_KEY || ''; // real key optional
const API_URL = (env.VITE_UQ_API_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
const MODEL   = env.VITE_UQ_LLM_MODEL || 'gpt-4o-mini';

// Enable mock if user asked OR in demo OR when no key is provided.
const MOCK = String(env.VITE_MOCK_AI) === '1' || String(env.VITE_DEMO) === '1' || !API_KEY;

// --- Public API ---
export async function generateQuestions({ role, description, num = 5, difficultyMix = true }) {
  // Fast path: mock/local mode
  if (MOCK) return normalize(makeMockQuestions({ role, description, num, difficultyMix }), num);

  // Live path: call OpenAI-compatible /chat/completions
  const systemPrompt = [
    'You are an expert technical interviewer.',
    'Return ONLY valid JSON: an array of objects { "question": string, "difficulty": "Easy|Intermediate|Advanced" }.'
  ].join(' ');

  const userPrompt = [
    `Role: ${role || 'N/A'}`,
    `Description:\n${description || 'N/A'}`,
    `Number of questions: ${num}`,
    `Output: JSON array with exactly ${num} entries.`
  ].join('\n');

  const url = API_URL + '/chat/completions';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: difficultyMix ? 0.4 : 0.2,
    }),
  });

  if (!res.ok) {
    // Try to salvage if provider already returned structured JSON
    const text = await res.text().catch(() => '');
    try {
      const maybe = JSON.parse(text);
      if (maybe && Array.isArray(maybe.questions)) return normalize(maybe.questions, num);
    } catch {}
    // As a last resort in portfolio/demo contexts, fail soft to mock
    return normalize(makeMockQuestions({ role, description, num, difficultyMix }), num);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content?.trim();
  if (content) return coerceToArray(content, num);

  if (data && Array.isArray(data.questions)) return normalize(data.questions, num);

  // Unexpected shape → soft fallback to mock
  return normalize(makeMockQuestions({ role, description, num, difficultyMix }), num);
}

// --- Helpers ---
function coerceToArray(text, num) {
  try {
    const parsed = JSON.parse(text);
    const arr = Array.isArray(parsed) ? parsed : parsed?.questions;
    if (!Array.isArray(arr)) throw new Error('Invalid JSON (no array).');
    return normalize(arr, num);
  } catch {
    // Attempt to extract the first JSON array in a possibly chatty reply
    const m = text.match(/\[[\s\S]*\]/);
    if (!m) throw new Error('Could not parse LLM JSON.');
    return normalize(JSON.parse(m[0]), num);
  }
}

function normalize(arr, num) {
  const allowed = ['Easy', 'Intermediate', 'Advanced'];
  return arr
    .slice(0, num)
    .map((q, i) => {
      const question = String(q?.question ?? '').trim();
      let diff = String(q?.difficulty ?? '').trim();

      // Canonicalise difficulty (accept common synonyms)
      const dl = diff.toLowerCase();
      if (!allowed.includes(diff)) {
        if (dl.startsWith('e')) diff = 'Easy';
        else if (dl.startsWith('m') || dl.includes('intermed')) diff = 'Intermediate';
        else if (dl.startsWith('h') || dl.includes('adv')) diff = 'Advanced';
        else diff = 'Intermediate';
      }
      // Ensure non-empty question in pathological cases
      return question ? { question, difficulty: diff } : { question: `Question ${i + 1}?`, difficulty: diff };
    })
    .filter(Boolean);
}

function makeMockQuestions({ role, description, num, difficultyMix }) {
  const base = (role || 'the role').toString().trim();
  const desc = (description || '').toString().trim();
  const pool = difficultyMix ? ['Easy', 'Intermediate', 'Advanced'] : ['Intermediate'];

  const hints = [
    'fundamentals',
    'practical scenario',
    'trade-offs',
    'debugging',
    'performance',
    'security',
    'testing',
    'architecture',
    'DX & tooling',
    'edge cases'
  ];

  return Array.from({ length: num }, (_ , i) => {
    const d = pool[i % pool.length];
    const hint = hints[i % hints.length];
    const label = desc ? ` based on: ${desc.slice(0, 80)}` : '';
    return {
      question: `For ${base}, discuss ${hint}${label}. Include concrete examples.`,
      difficulty: d,
    };
  });
}
