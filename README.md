# OpenHire

OpenHire is a lightweight interview manager with:
- React + Vite frontend
- JSON Server mock API for easy local setup
- Optional AI-based question generation (OpenAI-compatible)
- Optional offline speech-to-text via @xenova/transformers

## 🚀 Quick Start
```bash
git clone https://github.com/Dabbyyyy/openhire-interview-manager.git openhire
cd openhire
npm i
cp .env.example .env

# start the mock API (port 5174)
npm run mock

# start the app (port 5173)
npm run dev
```
Then open http://localhost:5173.

## 🧩 Key npm scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "mock": "node mock/server.js"
  }
}
```

## 🧰 Environment Variables
See `.env.example` for all variables.
- `VITE_API_BASE` – API base URL (default mock: `http://localhost:5174`)
- `VITE_OPENAI_API_KEY` – optional for AI question generation
- `VITE_ASR_MODEL` – ASR model (default: `Xenova/whisper-base.en`)
- `VITE_DISABLE_ASR` – disable ASR if low on memory
- `VITE_MOCK_AI` – mock AI responses if no key
- `VITE_DEMO` – fully offline demo mode

## 📜 License
MIT License (see LICENSE)
