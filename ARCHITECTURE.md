# Calendar Copilot - System Architecture

This diagram illustrates the flow of data between the user, the React frontend, the FastAPI backend, and external services like Google Calendar and LLMs.

```mermaid
graph TD
    %% User and Frontend interaction
    User([User Browser]) <-->|React + Tailwind| FE[Frontend: Vite/React]
    
    %% Backend core structure
    subgraph FastAPI_Backend [Backend: FastAPI]
        Router[API Router: main.py]
        DB[(SQLite: database.py)]
        GAuth[Google OAuth: google.py]
        Tools[Stats Tools: tools.py]
        Agent[Agent Orchestrator: agent.py]
    end

    %% External Connections
    GAPI[Google Calendar API]
    LLM[LLM: Gemini / OpenAI]

    %% Authentication Flow
    FE -- "/auth/login" --> Router
    Router -- "Redirect" --> GAuth
    GAuth -- "Authorize" --> GAPI
    GAPI -- "Code" --> GAuth
    GAuth -- "Store Tokens" --> DB

    %% Data Flow
    FE -- "/api/events" --> Router
    Router -- "Fetch" --> GAuth
    GAuth -- "API Request" --> GAPI
    GAPI -- "JSON Events" --> Tools
    Tools -- "Classified Events" --> Router
    Router -- "Response" --> FE

    %% Chat Agent Flow
    FE -- "/api/chat" --> Router
    Router -- "Context" --> Agent
    Agent -- "Compute Stats" --> Tools
    Agent -- "History & Context" --> LLM
    LLM -- "Natural Language" --> Agent
    Agent -- "Markdown Reply" --> Router
    Router -- "Response" --> FE

    %% Styling
    style FE fill:#f0f7ff,stroke:#0055ff,stroke-width:2px
    style FastAPI_Backend fill:#fdf8ff,stroke:#8800ff,stroke-width:2px
    style GAPI fill:#fff1f1,stroke:#ff0000,stroke-width:2px
    style LLM fill:#f0fff4,stroke:#00aa00,stroke-width:2px
```

## Flow Description

1.  **Authentication**: The User initiates a login, triggering the Google OAuth flow. Tokens (Access & Refresh) are stored in the local SQLite database to persist the session.
2.  **Event Visualization**: The Frontend requests events for the current week. The Backend retrieves them from Google, runs them through the `tools.py` classifier to assign categories (Meeting, Focus, etc.) and pastel colors, and returns them to the React Timeline.
3.  **Chat Interaction**: When a user asks a question (e.g., "How much time did I spend in meetings?"):
    *   The **Agent Orchestrator** detects the intent.
    *   It calls **Stats Tools** to get the actual quantitative data.
    *   It passes the user's question + the calculated data to the **LLM**.
    *   The LLM generates a clear, concise bullet-point strategy.
    *   If no LLM key exists, a **Rule-Based Fallback** provides a deterministic response using the same calculated data.
