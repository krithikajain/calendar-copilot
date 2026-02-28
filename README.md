# Calendar Copilot MVP

A complete web application MVP composed of a React (Vite) frontend and a FastAPI backend. It allows users to authenticate with Google Calendar, visualize their weekly schedule in a beautiful, Notion-like UI with pastel colors, and use an AI Chat panel to query and analyze their events.

## Features

- **Google OAuth**: One-click connect to Google Calendar.
- **Notion-like Weekly View**: Visual vertical timeline from 6am-10pm, color-coded based on AI-classified event categories.
- **Chat Agent**: Ask questions like "How can I reduce meetings next week?" to get rule-based or LLM-powered strategies (OpenAI/Gemini).
- **Rule-based Fallback**: Fully functional demo with "mock events" if you haven't supplied Google OAuth keys yet.

## Prerequisites
- Node.js (v18+)
- Python (3.12+)

## Setup

1. **Environment Variables**
   Duplicate `.env.example` to `.env` in the root folder.
   Fill in your API keys (Google, OpenAI/Gemini are optional for the basic demo).

2. **Run Backend (FastAPI)**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```
   *The backend will run on http://localhost:8000.*

3. **Run Frontend (React + Vite)**
   Open a new terminal session.
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *The frontend will run on http://localhost:5173.*

4. **Testing the App**
   Navigate to `http://localhost:5173`. 
   Click **"Connect Google Calendar"** to test OAuth, or simply observe the default **Mock events generated** in "Mock Mode".
   Try out the chat agent by clicking one of the quick prompts!
