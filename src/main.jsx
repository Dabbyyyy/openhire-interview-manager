// src/main.jsx
import 'bootstrap/dist/css/bootstrap.min.css';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import AppShell from './components/AppShell.jsx';
import InterviewsList from './pages/InterviewsList.jsx';
import InterviewForm from './pages/InterviewForm.jsx';
import QuestionsList from './pages/QuestionsList.jsx';
import QuestionForm from './pages/QuestionForm.jsx';
import ApplicantsList from './pages/ApplicantsList.jsx';
import ApplicantForm from './pages/ApplicantForm.jsx';
import TakeInterview from './pages/TakeInterview.jsx';
import Results from './pages/Results.jsx';
import NotFound from './pages/NotFound.jsx';
import AIQuestionWizard from './pages/AIQuestionWizard.jsx'; // <-- NEW

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <InterviewsList /> },
      { path: '/interviews/new', element: <InterviewForm mode="create" /> },
      { path: '/interviews/:id/edit', element: <InterviewForm mode="edit" /> },

      { path: '/interviews/:interviewId/questions', element: <QuestionsList /> },
      { path: '/interviews/:interviewId/questions/new', element: <QuestionForm mode="create" /> },
      { path: '/interviews/:interviewId/questions/:questionId/edit', element: <QuestionForm mode="edit" /> },
      { path: '/interviews/:interviewId/questions/ai', element: <AIQuestionWizard /> }, // <-- NEW

      { path: '/interviews/:interviewId/applicants', element: <ApplicantsList /> },
      { path: '/interviews/:interviewId/applicants/new', element: <ApplicantForm mode="create" /> },
      { path: '/interviews/:interviewId/applicants/:applicantId/edit', element: <ApplicantForm mode="edit" /> },

      { path: '/interviews/:interviewId/results', element: <Results /> },
    ],
  },

  { path: '/take/:interviewId/:applicantId', element: <TakeInterview /> },

  { path: '*', element: <NotFound /> },
]);

createRoot(document.getElementById('root')).render(<RouterProvider router={router} />);
