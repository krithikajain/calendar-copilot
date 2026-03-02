# Co-Calendar - System Architecture

This diagram illustrates the clean flow of data between the User, Frontend, Backend, Google Calendar, and LLMs. It is organized into four core pipelines: **Authentication**, **Calendar Data sync**, **AI Assistant logic**, and **Event Creation (Human-in-the-loop)**.

```mermaid
graph LR
    %% External Entities
    User([User Browser])
    GAPI([Google Calendar API])
    LLM([LLM: Gemini / OpenAI])

    %% Frontend
    subgraph Frontend ["Frontend (Vite/React + Tailwind)"]
        UI[React UI Components]
        Modal[Event Creation Modal]
        Recap[Koala Recap Engine]
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
    UI -->|Compute Stats Locally| Recap

    %% 3. Chat Agent Flow
    UI -->|3. Ask Question| Router
    Router -->|Forward Context| Agent
    Agent <-->|Compute Stats/Check Conflicts| Tools
    Agent -->|Prompt + Context| LLM
    LLM -->|Strategy/Markdown/Draft Event| Agent
    Agent -->|Response + UI Actions| UI

    %% 4. Human in the Loop Creation
    UI -->|Trigger Draft| Modal
    Modal -->|User Confirms Creation| Router
    Router -->|Insert Event| GAPI

    %% Styling 
    style Frontend fill:#f0f7ff,stroke:#0055ff,stroke-width:2px
    style Backend fill:#fdf8ff,stroke:#8800ff,stroke-width:2px
    style GAPI fill:#fff1f1,stroke:#ff0000,stroke-width:2px
    style LLM fill:#f0fff4,stroke:#00aa00,stroke-width:2px
    style DB fill:#eee,stroke:#999,stroke-width:2px
```

## Core Pipelines

1. **Authentication Flow (OAuth)**: The User initiates a login, triggering the Google OAuth flow in `google.py`. Tokens (Access & Refresh) are stored securely in the local SQLite database (`database.py`) to persist the session securely.
2. **Event Data Sync & Recap Stats**: The Frontend requests events for the loaded week. The Backend retrieves raw JSON from Google (`google.py`), runs them through the classifier (`tools.py`) to assign contextual tags (Meeting, Focus, Shared), and returns formatted data. Client-side, the **Koala Recap Engine** securely maps these events locally to calculate "Weekly Wrapped" dashboard stats natively in the browser timezone.
3. **AI Chat Engine (`agent.py`)**: When a user asks a question:
    * The **Agent Orchestrator** detects the functional intent.
    * It calls **Stats Tools** to compute actual numbers locally.
    * It builds a strict, grounded System Prompt combined with the local context and fires it to the **LLM**.
    * If the intent is `create_event_request`, the Agent bundles the drafted metadata securely inside a `ui_actions.open_create_event_modal` boolean.
4. **Event Creation (Human-in-the-Loop)**: The AI is restricted from writing to the DB directly. When a draft is returned by the LLM, the frontend safely intercepts the payload, mounting the **CreateEventModal**. Execution (writing to GAPI) strictly requires the user to review the fields and hit "Confirm".
