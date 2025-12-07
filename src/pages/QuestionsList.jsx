// src/pages/QuestionsList.jsx
import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Question, Interview } from '../lib/api';

export default function QuestionsList() {
  const { interviewId } = useParams();
  const navigate = useNavigate();

  const [interviewTitle, setInterviewTitle] = useState('');
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const i = await Interview.getById(interviewId);
      setInterviewTitle(i?.title ?? '');
      const data = await Question.listForInterview(interviewId);
      setRows(data ?? []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function onDelete(id) {
    if (!window.confirm('Delete this question?')) return;
    try { await Question.deleteById(id); load(); }
    catch (e) { alert('Delete failed: ' + e.message); }
  }

  useEffect(() => { load(); }, [interviewId]);

  if (error) return <div className="alert alert-danger">Error: {error}</div>;
  if (!rows) return <p>Loading…</p>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 m-0">Questions – {interviewTitle}</h1>
        <div className="d-flex gap-2">
          <Link to="new" className="btn btn-primary">+ New question</Link>
          <Link to="ai" className="btn btn-outline-secondary">AI: Generate</Link>
        </div>
      </div>

      {loading && <p>Refreshing…</p>}

      {rows.length === 0 ? (
        <p>No questions yet.</p>
      ) : (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr><th>Question</th><th>Difficulty</th><th className="text-end">Actions</th></tr>
            </thead>
            <tbody>
              {rows.map(q => (
                <tr key={q.id}>
                  <td style={{whiteSpace:'pre-wrap'}}>{q.question}</td>
                  <td>{q.difficulty}</td>
                  <td className="text-end">
                    <button
                      className="btn btn-sm btn-outline-secondary me-2"
                      onClick={() => navigate(`${q.id}/edit`)}
                    >Edit</button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => onDelete(q.id)}
                    >Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3">
        <Link to="/" className="btn btn-light">← Back to interviews</Link>
      </div>
    </div>
  );
}
