// src/pages/Results.jsx
import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Interview, Applicant, ApplicantAnswer, Question } from '../lib/api';

export default function Results() {
  const { interviewId } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [interview, setInterview] = useState(null);
  const [questions, setQuestions] = useState([]);   // [{id, question, difficulty}]
  const [applicants, setApplicants] = useState([]); // [{id, name, status}]
  const [activeApplicantId, setActiveApplicantId] = useState(null);
  const [answers, setAnswers] = useState([]);       // [{question_id, answer, ...}]

  // Load interview + questions + applicants
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [i, qs, as] = await Promise.all([
          Interview.getById(interviewId),
          Question.listForInterview(interviewId),
          Applicant.listForInterview(interviewId),
        ]);

        if (!i) throw new Error('Interview not found');

        const qsSorted = [...(qs || [])].sort((a, b) => a.id - b.id);
        const completed = (as || []).filter(a => (a.status || '').toLowerCase() === 'completed');
        const defaultApplicant = completed[0] || (as || [])[0] || null;

        setInterview(i);
        setQuestions(qsSorted);
        setApplicants(as || []);
        setActiveApplicantId(defaultApplicant?.id || null);
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [interviewId]);

  // Load answers when applicant changes
  useEffect(() => {
    (async () => {
      if (!activeApplicantId) {
        setAnswers([]);
        return;
      }
      try {
        setError(null);
        const aa = await ApplicantAnswer.listForApplicant(activeApplicantId);
        setAnswers(aa || []);
      } catch (e) {
        setError(e.message || String(e));
      }
    })();
  }, [activeApplicantId]);

  const answersByQ = useMemo(() => {
    const m = new Map();
    (answers || []).forEach(a => m.set(a.question_id, a));
    return m;
  }, [answers]);

  if (loading) return <p>Loading…</p>;

  return (
    <div className="container" style={{ maxWidth: 1100 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 m-0">Results — {interview?.title}</h1>
        <Link className="btn btn-light" to="/">← Back to interviews</Link>
      </div>

      {error && <div className="alert alert-warning">{error}</div>}

      <div className="row g-3">
        {/* Applicants list */}
        <div className="col-12 col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h2 className="h6 m-0">Applicants</h2>
                <span className="text-muted small">{applicants.length} total</span>
              </div>

              {applicants.length === 0 ? (
                <p className="text-muted m-0">No applicants yet.</p>
              ) : (
                <ul className="list-group">
                  {applicants.map(a => {
                    const isActive = a.id === activeApplicantId;
                    const badge =
                      (a.status || '').toLowerCase() === 'completed'
                        ? 'badge text-bg-success'
                        : 'badge text-bg-secondary';

                    return (
                      <button
                        key={a.id}
                        type="button"
                        className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${isActive ? 'active' : ''}`}
                        onClick={() => setActiveApplicantId(a.id)}
                      >
                        <span>{a.name || `Applicant ${a.id}`}</span>
                        <span className={badge}>{a.status || 'Unknown'}</span>
                      </button>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Answers */}
        <div className="col-12 col-md-8">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h2 className="h6 m-0">Answers</h2>
                {!activeApplicantId && (
                  <span className="text-muted small">Select an applicant to view answers</span>
                )}
              </div>

              {!activeApplicantId ? (
                <p className="text-muted m-0">No applicant selected.</p>
              ) : questions.length === 0 ? (
                <p className="text-muted m-0">No questions for this interview.</p>
              ) : (
                <div className="vstack gap-3">
                  {questions.map((q, idx) => {
                    const a = answersByQ.get(q.id);
                    return (
                      <div key={q.id} className="border rounded p-3">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="fw-semibold">Q{idx + 1}. {q.question}</div>
                          <span className="badge text-bg-light">{q.difficulty}</span>
                        </div>
                        <div className="mt-2" style={{ whiteSpace: 'pre-wrap' }}>
                          {a?.answer ? a.answer : <span className="text-muted">No answer.</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
