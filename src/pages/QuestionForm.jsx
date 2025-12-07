// src/pages/QuestionForm.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Question, api } from '../lib/api';

export default function QuestionForm({ mode = 'create' }) {
  const navigate = useNavigate();
  const { interviewId, questionId } = useParams();

  const [interviewTitle, setInterviewTitle] = useState('');
  const [form, setForm] = useState({
    question: '',
    difficulty: 'Easy', // Easy | Medium | Hard
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const i = await api('interview', { params: { id: `eq.${interviewId}` } });
        setInterviewTitle(i?.[0]?.title ?? '');
        if (mode === 'edit' && questionId) {
          const q = await api('question', { params: { id: `eq.${questionId}` } });
          if (q?.length) {
            setForm({ question: q[0].question, difficulty: q[0].difficulty });
          }
        }
      } catch (e) {
        setError(e.message);
      }
    }
    load();
  }, [interviewId, mode, questionId]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.question.trim()) {
      setError('Please enter the question text');
      return;
    }

    try {
      setSubmitting(true);
      if (mode === 'create') {
        await Question.create(interviewId, form);
      } else {
        await Question.updateById(questionId, form);
      }
      navigate(`/interviews/${interviewId}/questions`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <h1 className="h3 mb-3">
        {mode === 'create' ? 'New question' : 'Edit question'} – {interviewTitle}
      </h1>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={onSubmit} className="vstack gap-3">
        <div>
          <label className="form-label">Question</label>
          <textarea
            name="question"
            className="form-control"
            rows={4}
            value={form.question}
            onChange={onChange}
          />
        </div>

        <div>
          <label className="form-label">Difficulty</label>
          <select
            name="difficulty"
            className="form-select"
            value={form.difficulty}
            onChange={onChange}
          >
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
        </div>

        <div className="d-flex gap-2">
          <button disabled={submitting} className="btn btn-primary">
            {submitting ? 'Saving…' : 'Save'}
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
