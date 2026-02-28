# Co-Calendar - System Architecture

This diagram illustrates the clean flow of data between the User, Frontend, Backend, Google Calendar, and LLMs. It is organized into three core pipelines: **Authentication**, **Calendar Data sync**, and **AI Assistant logic**.

```mermaid
graph LR
    %% External Entities
    User([User Browser])
    GAPI([Google Calendar API])
    LLM([LLM: Gemini / OpenAI])

    %% Frontend
    subgraph Frontend ["Frontend (Vite/React + Tailwind)"]
        UI[React UI Components]
    end

    %% Backend
    subgraph Backend ["Backend (FastAPI)"]
        Router[API Router: main.py]
        Auth[OAuth & Tokens: google.py]
        Tools[Data Classifier: tools.py]
        Agent[Agent Orchestrator: agent.py]
        DB[(SQLite: database.py)]
    end

    %% 1. Authentication Flow
    User -->|1. Login| UI
    UI -->|Redirect| Auth
    Auth <-->|OAuth Trade| GAPI
    Auth -->|Store Token| DB

    %% 2. Data Flow
    UI -->|2. Request Week| Router
    Router -->|Fetch| Auth
    Auth -->|Pull JSON| GAPI
    GAPI -->|Raw Events| Auth
    Auth -->|Clean/Format| Tools
    Tools -->|Color & Categorize| Router
    Router -->|Timeline JSON| UI

    %% 3. Chat Agent Flow
    UI -->|3. Ask Question| Router
    Router -->|Forward Context| Agent
    Agent <-->|Compute Stats| Tools
    Agent -->|Prompt + Context| LLM
    LLM -->|Strategy/Markdown| Agent
    Agent -->|Response| UI

    %% Styling 
    style Frontend fill:#f0f7ff,stroke:#0055ff,stroke-width:2px
    style Backend fill:#fdf8ff,stroke:#8800ff,stroke-width:2px
    style GAPI fill:#fff1f1,stroke:#ff0000,stroke-width:2px
    style LLM fill:#f0fff4,stroke:#00aa00,stroke-width:2px
    style DB fill:#eee,stroke:#999,stroke-width:2px
```

## Core Pipelines

1. **Authentication Flow (OAuth)**: The User initiates a login, triggering the Google OAuth flow in `google.py`. Tokens (Access & Refresh) are stored securely in the local SQLite database (`database.py`) to persist the session securely.
2. **Event Data Sync**: The Frontend requests events for the loaded week. The Backend retrieves raw JSON from Google (`google.py`), runs them through the classifier (`tools.py`) to assign contextual tags (Meeting, Focus, Shared) and exact pastel color hexes, and returns formatted data to React.
3. **AI Chat Engine (`agent.py`)**: When a user asks a question:
    * The **Agent Orchestrator** detects the functional intent.
    * It calls **Stats Tools** to compute actual numbers locally (preventing LLM hallucinations).
    * It builds a strict, grounded System Prompt combined with the local context and fires it to the **LLM**.
    * If an API Key is missing or strictly fails, a local **Rule-Based Fallback** replies with the deterministic math variables.
