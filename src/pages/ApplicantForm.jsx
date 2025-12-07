// src/pages/ApplicantForm.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Applicant, api } from '../lib/api';

export default function ApplicantForm({ mode = 'create' }) {
  const navigate = useNavigate();
  const { interviewId, applicantId } = useParams();

  const [interviewTitle, setInterviewTitle] = useState('');
  const [form, setForm] = useState({
    title: 'Mr',
    firstname: '',
    surname: '',
    phone_number: '',
    email_address: '',
    // UX choice, free text in DB: Not Started | In Progress | Completed
    interview_status: 'Not Started',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const i = await api('interview', { params: { id: `eq.${interviewId}` } });
        setInterviewTitle(i?.[0]?.title ?? '');
        if (mode === 'edit' && applicantId) {
          const res = await api('applicant', { params: { id: `eq.${applicantId}` } });
          if (res?.length) {
            const a = res[0];
            setForm({
              title: a.title ?? 'Mr',
              firstname: a.firstname ?? '',
              surname: a.surname ?? '',
              phone_number: a.phone_number ?? '',
              email_address: a.email_address ?? '',
              interview_status: a.interview_status ?? 'Not Started',
            });
          }
        }
      } catch (e) {
        setError(e.message);
      }
    }
    load();
  }, [interviewId, mode, applicantId]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.firstname.trim() || !form.surname.trim()) {
      setError('Please enter first name and surname');
      return;
    }
    if (!form.email_address.trim()) {
      setError('Please enter an email address');
      return;
    }

    try {
      setSubmitting(true);
      if (mode === 'create') {
        await Applicant.create(interviewId, form);
      } else {
        await Applicant.updateById(applicantId, form);
      }
      navigate(`/interviews/${interviewId}/applicants`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <h1 className="h3 mb-3">
        {mode === 'create' ? 'New applicant' : 'Edit applicant'} – {interviewTitle}
      </h1>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={onSubmit} className="vstack gap-3">
        <div className="row g-3">
          <div className="col-3">
            <label className="form-label">Title</label>
            <select name="title" className="form-select" value={form.title} onChange={onChange}>
              <option>Mr</option>
              <option>Ms</option>
              <option>Mrs</option>
              <option>Mx</option>
              <option>Dr</option>
            </select>
          </div>
          <div className="col">
            <label className="form-label">First name</label>
            <input name="firstname" className="form-control" value={form.firstname} onChange={onChange} />
          </div>
          <div className="col">
            <label className="form-label">Surname</label>
            <input name="surname" className="form-control" value={form.surname} onChange={onChange} />
          </div>
        </div>

        <div className="row g-3">
          <div className="col">
            <label className="form-label">Email</label>
            <input name="email_address" type="email" className="form-control" value={form.email_address} onChange={onChange} />
          </div>
          <div className="col">
            <label className="form-label">Phone</label>
            <input name="phone_number" className="form-control" value={form.phone_number} onChange={onChange} />
          </div>
        </div>

        <div>
          <label className="form-label">Interview status</label>
          <select name="interview_status" className="form-select" value={form.interview_status} onChange={onChange}>
            <option>Not Started</option>
            <option>In Progress</option>
            <option>Completed</option>
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
