// src/pages/InterviewsList.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Interview, Question, Applicant } from '../lib/api';

export default function InterviewsList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  async function load() {
    try {
      setLoading(true);
      setErr(null);

      const interviews = await Interview.list();

      // Enrich with counts (#questions, applicants NS/C)
      const withCounts = await Promise.all(
        (interviews || []).map(async (i) => {
          const [qs, as] = await Promise.all([
            Question.listForInterview(i.id),
            Applicant.listForInterview(i.id),
          ]);
          const totalQ = (qs || []).length;
          const notStarted = (as || []).filter(a => (a.status || '').toLowerCase() !== 'completed').length;
          const completed = (as || []).filter(a => (a.status || '').toLowerCase() === 'completed').length;

          return { ...i, totalQ, notStarted, completed };
        })
      );

      setRows(withCounts);
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onDelete(id, title) {
    const ok = window.confirm(`Delete interview "${title}"? This cannot be undone.`);
    if (!ok) return;
    try {
      // Optimistic UI: gray out while deleting (optional)
      setRows(rs => rs.map(r => (r.id === id ? { ...r, _deleting: true } : r)));
      await Interview.deleteById(id);
      // Reload list to refresh counts
      await load();
    } catch (e) {
      setErr(e.message || String(e));
      // Revert optimistic flag if needed
      setRows(rs => rs.map(r => (r.id === id ? { ...r, _deleting: false } : r)));
    }
  }

  if (loading) return <p>Loading…</p>;

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 m-0">Interviews</h1>
        <Link className="btn btn-primary" to="/interviews/new">+ New interview</Link>
      </div>

      {err && <div className="alert alert-warning">{err}</div>}

      {rows.length === 0 ? (
        <p className="text-muted">No interviews yet.</p>
      ) : (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Title</th>
                <th>Job role</th>
                <th># Questions</th>
                <th>Applicants (NS / C)</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i.id} className={i._deleting ? 'opacity-50' : ''}>
                  <td>{i.title}</td>
                  <td>{i.job_role}</td>
                  <td>{i.totalQ}</td>
                  <td>{i.notStarted} / {i.completed}</td>
                  <td className="text-end">
                    <div className="btn-group">
                      <Link className="btn btn-outline-primary btn-sm" to={`/interviews/${i.id}/questions`}>Questions</Link>
                      <Link className="btn btn-outline-secondary btn-sm" to={`/interviews/${i.id}/applicants`}>Applicants</Link>
                      <Link className="btn btn-outline-success btn-sm" to={`/interviews/${i.id}/results`}>Results</Link>
                      <Link className="btn btn-outline-dark btn-sm" to={`/interviews/${i.id}/edit`}>Edit</Link>
                      {/* Delete inline (no route = no 404) */}
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => onDelete(i.id, i.title)}
                        disabled={!!i._deleting}
                        title="Delete interview"
                      >
                        {i._deleting ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
