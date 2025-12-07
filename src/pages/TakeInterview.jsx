// src/pages/TakeInterview.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Applicant, ApplicantAnswer, Interview, Question } from '../lib/api';
import { transcribe as whisperTranscribe } from '../lib/asr';

export default function TakeInterview() {
  const { interviewId, applicantId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [interview, setInterview] = useState(null);
  const [applicant, setApplicant] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [step, setStep] = useState(-1); // -1 welcome; 0..n-1 questions; n thank-you
  const [answerText, setAnswerText] = useState('');
  const [saving, setSaving] = useState(false);

  // Recording state
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [recording, setRecording] = useState(false);
  const [canStart, setCanStart] = useState(true);  // allow only one start per question
  const [canPause, setCanPause] = useState(false);
  const [paused, setPaused] = useState(false);

  // Optional Web Speech (nice-to-have live text while recording)
  const SpeechRec = useMemo(() => {
    const w = window;
    return w.SpeechRecognition || w.webkitSpeechRecognition || null;
  }, []);
  const recRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [i, a, qs] = await Promise.all([
          Interview.getById(interviewId),
          Applicant.getById(applicantId),
          Question.listForInterview(interviewId),
        ]);
        if (!i || !a) throw new Error('Interview or applicant not found');
        setInterview(i);
        setApplicant(a);
        setQuestions(qs || []);
      } catch (e) { setErr(e.message); }
      finally { setLoading(false); }
    })();
  }, [interviewId, applicantId]);

  function questionAt(idx) { return questions[idx]; }

  async function startRecording() {
    if (!canStart) return;
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (ev) => { if (ev.data.size > 0) chunksRef.current.push(ev.data); };
      mr.onstart = () => { setRecording(true); setCanPause(true); };
      mr.onpause = () => setPaused(true);
      mr.onresume = () => setPaused(false);
      mr.onstop = async () => {
        setRecording(false);
        setPaused(false);
        setCanPause(false);

        // Build final Blob
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });

      
        try {
          const text = await whisperTranscribe(blob);
          if (text) {
            setAnswerText(t => t ? `${t} ${text}` : text);
          }
        } catch {
          // If Whisper fails (network/cache), user can still type or rely on any Web Speech text already added
        }
      };

      mr.start(); // begin capture
      setCanStart(false); // prevent restarting recording for this question

      // Optional live speech-to-text
      if (SpeechRec) {
        const rec = new SpeechRec();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';
        rec.onresult = (e) => {
          const last = e.results[e.results.length - 1];
          if (last && last[0]) {
            const seg = last[0].transcript.trim();
            if (seg) setAnswerText(prev => (prev ? prev + ' ' : '') + seg);
          }
        };
        rec.onerror = () => {};
        rec.onend = () => {};
        rec.start();
        recRef.current = rec;
      }
    } catch (e) {
      setErr('Microphone permission denied or unavailable. You can type your answer instead.');
    }
  }

  function pauseResume() {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    if (mr.state === 'recording') {
      mr.pause();
    } else if (mr.state === 'paused') {
      mr.resume();
    }
  }

  function stopRecording() {
    try {
      if (recRef.current) { recRef.current.stop(); recRef.current = null; }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      }
    } catch {}
  }

  async function saveAndNext() {
    const idx = step;
    const q = questionAt(idx);
    if (!q) return;

    if (!answerText.trim()) {
      setErr('Please record (or type) an answer before continuing.');
      return;
    }

    try {
      setSaving(true);
      await ApplicantAnswer.create({
        interview_id: interview.id,
        question_id: q.id,
        applicant_id: applicant.id,
        answer: answerText.trim(),
      });

      // reset per-question state
      setAnswerText('');
      setCanStart(true);
      setPaused(false);
      setCanPause(false);

      if (idx + 1 < questions.length) {
        setStep(idx + 1);
      } else {
        try { await Applicant.updateById(applicant.id, { interview_status: 'Completed' }); } catch {}
        setStep(questions.length);
      }
      window.scrollTo(0, 0);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  // UI
  if (loading) return <p>Loading interview…</p>;
  if (err && step === -1) return <div className="alert alert-danger">{String(err)}</div>;
  if (!interview || !applicant) return <p>Not found.</p>;

  if (step === -1) {
    return (
      <div className="container" style={{ maxWidth: 720 }}>
        <h1 className="h3 mb-3">{interview.title}</h1>
        <p>Hello {applicant.firstname} {applicant.surname}, welcome to your interview.</p>
        <ul>
          <li>You’ll answer {questions.length} question(s), one per page.</li>
          <li>Click <strong>Start recording</strong> to speak your answer, then you can <strong>Pause</strong> and <strong>Resume</strong>, and finally <strong>Stop</strong>.</li>
          <li>We’ll transcribe your speech to text (Whisper) — you can edit the text before continuing.</li>
        </ul>
        <div className="d-flex gap-2 mt-3">
          <button className="btn btn-primary" onClick={() => setStep(0)} disabled={questions.length === 0}>Start</button>
          <Link to="/" className="btn btn-light">Return home</Link>
        </div>
      </div>
    );
  }

  if (step >= questions.length) {
    return (
      <div className="container" style={{ maxWidth: 720 }}>
        <h1 className="h3 mb-3">Thank you!</h1>
        <p>Your responses have been submitted.</p>
      </div>
    );
  }

  const q = questionAt(step);

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <div className="mb-2 text-muted small">Question {step + 1} of {questions.length}</div>
      <h1 className="h4 mb-3">{q?.question}</h1>

      {err && <div className="alert alert-danger" aria-live="polite">{err}</div>}

      <div className="d-flex gap-2 align-items-center mb-2">
        <button className="btn btn-outline-primary" disabled={!canStart} onClick={startRecording}>Start recording</button>
        <button className="btn btn-outline-secondary" disabled={!canPause} onClick={pauseResume}>
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button className="btn btn-outline-danger" disabled={!recording && !paused} onClick={stopRecording}>Stop</button>
        {(recording || paused) && <span className="text-danger small">{paused ? 'Paused' : 'Recording…'}</span>}
      </div>

      <div className="mb-3">
        <label className="form-label">Transcribed / typed answer</label>
        <textarea
          className="form-control"
          rows={5}
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          placeholder="Speak or type your answer here…"
        />
        <div className="form-text">
          Only the text is saved. If speech isn’t possible, you can type your answer.
        </div>
      </div>

      <div className="d-flex gap-2">
        <button className="btn btn-primary" disabled={saving} onClick={saveAndNext}>
          {step + 1 < questions.length ? 'Next' : 'Submit'}
        </button>
      </div>
    </div>
  );
}
