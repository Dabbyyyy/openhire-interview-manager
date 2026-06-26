# OpenHire

OpenHire is a web-based interview management system built with React, Vite, and Supabase. It allows recruiters and hiring managers to create interviews, manage applicants, generate AI-assisted interview questions, and collect candidate responses.

## Features

- Create, edit, and delete interviews
- Manage interview questions with difficulty levels
- Manage applicants for each interview
- Generate interview questions using OpenAI
- Share interview links with candidates
- Record and store candidate answers
- Optional offline speech-to-text support using `@xenova/transformers`
- Responsive user interface built with Bootstrap

## Technology Stack

### Frontend
- React
- Vite
- React Router
- Bootstrap

### Backend and Database
- Supabase

### AI Features
- OpenAI API
- `@xenova/transformers` for offline speech recognition

## Project Structure

```text
src/
├── pages/
│   ├── AIQuestionWizard.jsx
│   ├── ApplicantForm.jsx
│   ├── ApplicantsList.jsx
│   ├── InterviewForm.jsx
│   ├── InterviewsList.jsx
│   ├── QuestionForm.jsx
│   ├── QuestionsList.jsx
│   ├── Results.jsx
│   └── TakeInterview.jsx
├── lib/
│   ├── api.js
│   ├── llm.js
│   └── supabase.js
├── App.jsx
└── App.css
```

## Prerequisites

- Node.js 18 or newer
- npm
- A Supabase project
- An OpenAI API key (optional)

## Quick Start (Local)

```bash
git clone <your-repository-url>
cd openhire-interview-manager

npm install
```

Create a `.env` file in the project root and add:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key

VITE_OPENAI_API_KEY=your_openai_api_key

VITE_ASR_MODEL=Xenova/whisper-base.en
VITE_DISABLE_ASR=0
VITE_MOCK_AI=0
VITE_DEMO=0
```

Start the development server:

```bash
npm run dev
```

Then open:

```text
http://localhost:5173
```

## Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Create production build
npm run preview   # Preview production build locally
```

## Database Schema

### interviews
- id
- title
- job_role
- description
- status
- created_at

### questions
- id
- interview_id
- question
- difficulty
- created_at

### applicants
- id
- interview_id
- title
- firstname
- surname
- email
- phone
- interview_status
- created_at

### answers
- id
- interview_id
- question_id
- applicant_id
- answer
- created_at

## AI Question Generation

The application uses the OpenAI Chat Completions API to generate interview questions.

To use this feature, provide a valid API key in the `.env` file:

```env
VITE_OPENAI_API_KEY=your_openai_api_key
```

If you want to run the application without OpenAI access, enable mock mode:

```env
VITE_MOCK_AI=1
```

## Production Build

```bash
npm run build
```

The optimized build will be generated in the `dist/` folder.

## License

See MIT License
