// src/pages/AIQuestionWizard.jsx
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Interview, Question } from '../lib/api';
import { generateQuestions } from '../lib/llm';

// --- helpers -------------------------------------------------------------

// Canonical difficulty expected by DB: Easy | Intermediate | Advanced
function canonDifficulty(raw) {
  const allowed = ['Easy', 'Intermediate', 'Advanced'];
  let d = String(raw || '').trim();
  if (allowed.includes(d)) return d;

  const dl = d.toLowerCase();

  // Common synonyms / first-letter matches
  if (dl.startsWith('e')) return 'Easy';
  if (dl.startsWith('m') || dl.includes('intermed')) return 'Intermediate';
  if (dl.startsWith('h') || dl.includes('adv')) return 'Advanced';

  // Safe default
  return 'Intermediate';
}

// Optionally clamp question length to avoid DB length constraints (adjust if needed)
function clampQuestion(text, max = 500) {
  const t = String(text || '').trim();
  return t.length > max ? t.slice(0, max) : t;
}

// --- component -----------------------------------------------------------

export default function AIQuestionWizard() {
  const { interviewId } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [form, setForm] = useState({
    num: 5,
    difficultyMix: true,
    role: '',
    description: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [generated, setGenerated] = useState([]); // [{ question, difficulty }, ...]
  const [selected, setSelected] = useState({});   // { idx: true/false }
  const [working, setWorking] = useState(false);

  // Load interview and seed form with role/description
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const i = await Interview.getById(interviewId);
        if (!i) throw new Error('Interview not found');
        setInterview(i);
        setForm((f) => ({
          ...f,
          role: i.job_role || '',
          description: i.description || '',
        }));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [interviewId]);

  function onChange(e) {
    const { name, type, checked, value } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  async function onGenerate(e) {
    e.preventDefault();
    setError(null);
    setGenerated([]);
    setSelected({});
    try {
      setWorking(true);
      const list = await generateQuestions({
        role: form.role,
        description: form.description,
        num: Math.max(1, Math.min(10, Number(form.num) || 5)),
        difficultyMix: !!form.difficultyMix,
      });

      // Pre-sanitise difficulties so the preview shows exactly what will be inserted
      const clean = (Array.isArray(list) ? list : []).map((q) => ({
        question: clampQuestion(q.question),
        difficulty: canonDifficulty(q.difficulty),
      }));

      setGenerated(clean);
      setSelected(Object.fromEntries(clean.map((_, i) => [i, true])));
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setWorking(false);
    }
  }

  async function onInsertSelected() {
    setError(null);
    try {
      setWorking(true);
      const toInsert = generated.filter((_, i) => selected[i]);

      // Extra safety: normalise again at insert time
      for (const q of toInsert) {
        const question = clampQuestion(q.question);
        const difficulty = canonDifficulty(q.difficulty);
        if (!question) continue; // skip empties safely

        await Question.create(interviewId, { question, difficulty });
      }

      navigate(`/interviews/${interviewId}/questions`);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setWorking(false);
    }
  }

  if (loading) return <p>Loading…</p>;

  return (
    <div className="container" style={{ maxWidth: 900 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 m-0">AI Question Generator — {interview?.title}</h1>
        <Link className="btn btn-light" to={`/interviews/${interviewId}/questions`}>
          ← Back
        </Link>
      </div>

      {error && (
        <div className="alert alert-warning" aria-live="polite">
          {error}
        </div>
      )}

      <form onSubmit={onGenerate} className="card mb-4">
        <div className="card-body vstack gap-3">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label">Role</label>
              <input
                className="form-control"
                name="role"
                value={form.role}
                onChange={onChange}
                placeholder="e.g., Frontend Engineer"
              />
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label">How many?</label>
              <input
                type="number"
                min={1}
                max={10}
                className="form-control"
                name="num"
                value={form.num}
                onChange={onChange}
              />
            </div>
            <div className="col-12 col-md-3 d-flex align-items-end">
              <div className="form-check">
                <input
                  className="form-check-input"
                  id="mix"
                  type="checkbox"
                  name="difficultyMix"
                  checked={!!form.difficultyMix}
                  onChange={onChange}
                />
                <label className="form-check-label" htmlFor="mix">
                  Mix difficulties
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="form-label">Description / Context</label>
            <textarea
              className="form-control"
              rows={4}
              name="description"
              value={form.description}
              onChange={onChange}
              placeholder="Paste role summary, stack, and responsibilities"
            />
          </div>

          <div className="d-flex gap-2">
            <button className="btn btn-primary" disabled={working}>
              {working ? 'Generating…' : 'Generate questions'}
            </button>
          </div>
        </div>
      </form>

      {generated.length > 0 && (
        <div className="card">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h2 className="h6 m-0">Preview & select</h2>
              <button
                className="btn btn-success btn-sm"
                disabled={working}
                onClick={onInsertSelected}
              >
                {working ? 'Inserting…' : 'Insert selected'}
              </button>
            </div>

            <div className="vstack gap-3">
              {generated.map((q, i) => (
                <div key={i} className="border rounded p-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="form-check">
                      <input
                        className="form-check-input me-2"
                        type="checkbox"
                        checked={!!selected[i]}
                        onChange={(e) =>
                          setSelected((s) => ({ ...s, [i]: e.target.checked }))
                        }
                        id={`sel-${i}`}
                      />
                      <label className="form-check-label fw-semibold" htmlFor={`sel-${i}`}>
                        {canonDifficulty(q.difficulty)}
                      </label>
                    </div>
                    <span className="badge text-bg-light">
                      {canonDifficulty(q.difficulty)}
                    </span>
                  </div>
                  <div className="mt-2" style={{ whiteSpace: 'pre-wrap' }}>
                    {clampQuestion(q.question)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
