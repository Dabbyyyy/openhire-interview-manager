// src/lib/api.js

const BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5174').replace(/\/+$/, '');
const TOKEN = import.meta.env.VITE_API_TOKEN || '';
const IS_MOCK = /localhost:5174|127\.0\.0\.1:5174/.test(BASE) || (import.meta.env.VITE_DEMO === '1');

// ------- helpers: path/param/body/response transforms for mock --------
const resourceMap = {
  interview: 'interviews',
  question: 'questions',
  applicant: 'applicants',
  applicant_answer: 'answers', // add "answers": [] to mock/db.json if you use this
};

function toMockPath(path) {
  return resourceMap[path] || path;
}

// Convert { id: "eq.1", interview_id: "eq.7" } -> { id: "1", interviewId: "7" } for mock
function normalizeParamsForMock(params) {
  if (!params) return undefined;
  const out = {};
  for (const [k, v] of Object.entries(params)) {
    let val = v;
    if (typeof val === 'string' && val.startsWith('eq.')) val = val.slice(3);
    let key = k;
    if (k.endsWith('_id')) {
      key = k.replace('_id', 'Id');
    }
    out[key] = val;
  }
  return out;
}

// Convert body snake_case -> camelCase for known *_id fields; drop username on mock
function bodyForMock(body) {
  if (!body || typeof body !== 'object') return body;
  const out = {};
  for (const [k, v] of Object.entries(body)) {
    if (k === 'username') continue; // not needed in indie mock
    let key = k;
    if (k.endsWith('_id')) key = k.replace('_id', 'Id');
    out[key] = v;
  }
  return out;
}

// Convert response camelCase -> snake_case for *_Id keys so the rest of your UI still works
function respFromMock(data) {
  const convertObj = (obj) => {
    const o = {};
    for (const [k, v] of Object.entries(obj)) {
      let key = k;
      if (k.endsWith('Id')) key = k.replace(/Id$/, '_id');
      o[key] = (v && typeof v === 'object' && !Array.isArray(v)) ? convertObj(v) : Array.isArray(v) ? v.map(x => (x && typeof x === 'object') ? convertObj(x) : x) : v;
    }
    return o;
  };
  if (Array.isArray(data)) return data.map(d => (d && typeof d === 'object') ? convertObj(d) : d);
  if (data && typeof data === 'object') return convertObj(data);
  return data;
}

// Build URL with params for both backends
function buildUrl(path, params) {
  const effectivePath = IS_MOCK ? toMockPath(path) : path;
  const url = new URL(`${BASE}/${effectivePath}`);
  const qp = IS_MOCK ? normalizeParamsForMock(params) : params;
  if (qp) Object.entries(qp).forEach(([k, v]) => url.searchParams.set(k, v));
  return url;
}

// ------------- core fetch wrapper -------------
export async function api(path, { method = 'GET', body, params } = {}) {
  const url = buildUrl(path, params);

  const headers = { 'Content-Type': 'application/json' };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  // Prefer header is PostgREST-specific; safe to omit on mock, include if you want:
  if (!IS_MOCK) headers.Prefer = 'return=representation';

  const payload = IS_MOCK ? bodyForMock(body) : body;

  const res = await fetch(url, {
    method,
    headers,
    body: payload ? JSON.stringify(payload) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${text}`);
  }

  const ct = res.headers.get('content-type') || '';
  let data = ct.includes('application/json') ? await res.json() : null;

  // JSON Server returns a single object on POST by default; normalize to array like PostgREST if needed
  if (IS_MOCK && method === 'POST' && data && !Array.isArray(data)) {
    data = [data];
  }

  return IS_MOCK ? respFromMock(data) : data;
}

// ------------- Resource clients -------------

// Interviews
export const Interview = {
  list: () => api('interview'),
  getById: (id) =>
    api('interview', { params: { id: `eq.${id}` } }).then(r => Array.isArray(r) ? r[0] : r),
  create: (data) => api('interview', { method: 'POST', body: { ...data } }),
  updateById: (id, data) =>
    api('interview', { method: 'PATCH', body: data, params: { id: `eq.${id}` } }),
  deleteById: (id) =>
    api('interview', { method: 'DELETE', params: { id: `eq.${id}` } }),
};

// Questions
export const Question = {
  listForInterview: (interviewId) =>
    api('question', { params: { interview_id: `eq.${interviewId}` } }),
  getById: (id) =>
    api('question', { params: { id: `eq.${id}` } }).then(r => Array.isArray(r) ? r[0] : r),
  create: (interviewId, data) =>
    api('question', { method: 'POST', body: { interview_id: interviewId, ...data } }),
  updateById: (id, data) =>
    api('question', { method: 'PATCH', body: data, params: { id: `eq.${id}` } }),
  deleteById: (id) =>
    api('question', { method: 'DELETE', params: { id: `eq.${id}` } }),
};

// Applicants
export const Applicant = {
  listForInterview: (interviewId) =>
    api('applicant', { params: { interview_id: `eq.${interviewId}` } }),
  getById: (id) =>
    api('applicant', { params: { id: `eq.${id}` } }).then(r => Array.isArray(r) ? r[0] : r),
  create: (interviewId, data) =>
    api('applicant', { method: 'POST', body: { interview_id: interviewId, ...data } }),
  updateById: (id, data) =>
    api('applicant', { method: 'PATCH', body: data, params: { id: `eq.${id}` } }),
  deleteById: (id) =>
    api('applicant', { method: 'DELETE', params: { id: `eq.${id}` } }),
};

// Applicant Answers (text-only)
export const ApplicantAnswer = {
  listForApplicant: (applicantId) =>
    api('applicant_answer', { params: { applicant_id: `eq.${applicantId}` } }),
  create: ({ interview_id, question_id, applicant_id, answer }) =>
    api('applicant_answer', {
      method: 'POST',
      body: { interview_id, question_id, applicant_id, answer },
    }),
};
