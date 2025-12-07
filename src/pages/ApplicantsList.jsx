// src/pages/ApplicantsList.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Applicant, api } from '../lib/api';

export default function ApplicantsList() {
  const { interviewId } = useParams();
  const navigate = useNavigate();

  const [interviewTitle, setInterviewTitle] = useState('');
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const i = await api('interview', { params: { id: `eq.${interviewId}` } });
      setInterviewTitle(i?.[0]?.title ?? '');
      const data = await Applicant.listForInterview(interviewId);
      setRows(data ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(id) {
    if (!window.confirm('Delete this applicant?')) return;
    try {
      await Applicant.deleteById(id);
      load();
    } catch (e) {
      alert('Delete failed: ' + e.message);
    }
  }

  function shareLinkFor(applicantId) {
    // This will be used by the Take Interview flow later.
    return `${window.location.origin}/take/${interviewId}/${applicantId}`;
  }

  async function onCopy(link) {
    try {
      await navigator.clipboard.writeText(link);
      alert('Link copied to clipboard!');
    } catch {
      prompt('Copy this link:', link);
    }
  }

  useEffect(() => { load(); }, [interviewId]);

  if (error) return <div className="alert alert-danger">Error: {error}</div>;
  if (!rows) return <p>Loading…</p>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 m-0">Applicants – {interviewTitle}</h1>
        <Link to="new" className="btn btn-primary">+ New applicant</Link>
      </div>

      {loading && <p>Refreshing…</p>}

      {rows.length === 0 ? (
        <p>No applicants yet.</p>
      ) : (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(a => {
                const fullName = [a.title, a.firstname, a.surname].filter(Boolean).join(' ');
                const link = shareLinkFor(a.id);
                return (
                  <tr key={a.id}>
                    <td>{fullName}</td>
                    <td>{a.email_address}</td>
                    <td>{a.phone_number}</td>
                    <td>{a.interview_status}</td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={() => onCopy(link)}>
                        Copy link
                      </button>
                      <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => navigate(`${a.id}/edit`)}>
                        Edit
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(a.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
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
