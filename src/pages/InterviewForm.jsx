// src/pages/InterviewForm.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Interview, api } from '../lib/api';

export default function InterviewForm({ mode = 'create' }) {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    title: '',
    job_role: '',
    description: '',
    status: 'Draft', // Allowed: Draft | Published | Archived
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const required = ['title', 'job_role', 'description', 'status'];

  // load existing when editing
  useEffect(() => {
    async function loadExisting() {
      try {
        const data = await api('interview', { params: { id: `eq.${id}` } });
        if (Array.isArray(data) && data.length > 0) {
          const { title, job_role, description, status } = data[0];
          setForm({ title, job_role, description, status });
        }
      } catch (e) {
        setError(e.message);
      }
    }
    if (mode === 'edit' && id) loadExisting();
  }, [mode, id]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);

    for (const k of required) {
      if (!String(form[k]).trim()) {
        setError(`Please enter ${k.replace('_', ' ')}`);
        return;
      }
    }

    try {
      setSubmitting(true);
      if (mode === 'create') {
        await Interview.create(form);
      } else {
        await Interview.updateById(id, form);
      }
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <h1 className="h3 mb-3">{mode === 'create' ? 'New interview' : 'Edit interview'}</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={onSubmit} className="vstack gap-3">
        <div>
          <label className="form-label">Title</label>
          <input name="title" className="form-control" value={form.title} onChange={onChange} />
        </div>

        <div>
          <label className="form-label">Job role</label>
          <input name="job_role" className="form-control" value={form.job_role} onChange={onChange} />
        </div>

        <div>
          <label className="form-label">Description</label>
          <textarea name="description" className="form-control" rows={3} value={form.description} onChange={onChange} />
        </div>

        <div>
          <label className="form-label">Status</label>
          <select name="status" className="form-select" value={form.status} onChange={onChange}>
            <option>Draft</option>
            <option>Published</option>
            <option>Archived</option>
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
