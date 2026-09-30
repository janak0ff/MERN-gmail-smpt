# Quick Mail Architecture

Quick Mail is a React/Vite email workspace backed by an Express API,
MongoDB, Gmail SMTP, Redis, and a BullMQ delivery worker. In the recommended
deployment, host Nginx is the only public HTTP entry point and Docker exposes
the application services on loopback ports.

## System context

```mermaid
flowchart LR
    User[User browser]
    Nginx[Host Nginx :80 / HTTPS]
    Frontend[Frontend container<br/>Nginx :80]
    API[Backend container<br/>Express :5000]
    Worker[Email worker<br/>BullMQ consumer]
    Redis[(Redis<br/>queue + delayed jobs)]
    Mongo[(MongoDB Atlas<br/>users, mail, drafts, templates)]
    Gmail[Gmail SMTP]

    User --> Nginx
    Nginx -->|/| Frontend
    Nginx -->|/api| API
    Frontend -. same-origin API calls .-> Nginx
    API --> Mongo
    API --> Redis
    Redis --> Worker
    Worker --> Mongo
    Worker --> Gmail
    API --> Gmail
```

## Repository architecture

```mermaid
flowchart TD
    UI[frontend/src]
    APP[App.jsx]
    AUTHUI[AuthPage / ChangePassword]
    COMPOSE[ComposeEmail]
    WORKSPACE[Workspace<br/>templates and drafts]
    HISTORY[EmailHistory]
    API_CLIENT[Axios API client]

    SERVER[backend/server.js]
    AUTH[ routes/auth.js<br/>JWT cookie sessions]
    EMAIL[ routes/email.js<br/>send, history, scheduling]
    DRAFTS[ routes/drafts.js]
    TEMPLATES[ routes/templates.js]
    MW[auth middleware<br/>rate limits and validation]
    SERVICE[emailService.js]
    MODELS[User / Email / Draft / EmailTemplate]
    QUEUE[emailQueue.js]
    WORKER[emailWorker.js]

    UI --> APP
    APP --> AUTHUI
    APP --> COMPOSE
    APP --> WORKSPACE
    APP --> HISTORY
    APP --> API_CLIENT
    API_CLIENT --> SERVER
    SERVER --> AUTH
    SERVER --> EMAIL
    SERVER --> DRAFTS
    SERVER --> TEMPLATES
    AUTH --> MW
    EMAIL --> MW
    EMAIL --> SERVICE
    EMAIL --> QUEUE
    DRAFTS --> MODELS
    TEMPLATES --> MODELS
    SERVICE --> MODELS
    QUEUE --> WORKER
    WORKER --> SERVICE
```

## Runtime services

| Service | Container | Purpose | Loopback port |
|---|---|---|---:|
| Host Nginx | system service | Public reverse proxy | 80/443 |
| Frontend | `mern-smtp-frontend` | Static React/Vite assets | 3000 |
| Backend | `mern-smtp-backend` | Express API and direct sends | 5000 |
| Worker | `mern-smtp-worker` | Queued and scheduled delivery | none |
| Redis | `mern-smtp-redis` | BullMQ queue and delayed jobs | 6379 |
| MongoDB | `mern-smtp-mongodb` | Optional local database profile | 27017 |

MongoDB Atlas is the active production database. The local MongoDB service is
only enabled with the `local-db` Compose profile.

All Docker services use `restart: "no"` so this application does not return
after a reboot unless explicitly started. Redis and the worker are part of
the full queue deployment and should be started together with the backend.

## Request flows

### Authentication

```mermaid
sequenceDiagram
    participant B as Browser
    participant N as Nginx
    participant A as Express auth route
    participant M as MongoDB

    B->>N: POST /api/auth/register or /login
    N->>A: Forward request
    A->>M: Create/find user
    A->>A: Hash/verify password
    A-->>B: HttpOnly auth cookie
    B->>N: Authenticated API request
    N->>A: Forward cookie
    A->>M: Resolve authenticated user
```

### Direct email send

```mermaid
sequenceDiagram
    participant B as Browser
    participant A as Express API
    participant M as MongoDB
    participant S as Gmail SMTP

    B->>A: Multipart send request + auth cookie
    A->>A: Validate user, recipients, HTML, files
    A->>M: Save pending email
    A->>S: Deliver message
    S-->>A: SMTP result
    A->>M: Mark sent or failed
    A-->>B: Delivery response
```

### Scheduled email

```mermaid
sequenceDiagram
    participant B as Browser
    participant A as API
    participant M as MongoDB
    participant R as Redis/BullMQ
    participant W as Worker
    participant S as Gmail SMTP

    B->>A: POST /api/email/schedule
    A->>M: Save scheduled record
    A->>R: Add delayed job
    A-->>B: Scheduled response
    R->>W: Release job at scheduled time
    W->>M: Load scheduled record
    W->>S: Send message
    S-->>W: SMTP result
    W->>M: Mark sent or failed
```

## Security boundaries

- Nginx is the public boundary; Docker ports bind to `127.0.0.1`.
- Authentication uses HttpOnly SameSite cookies. Bearer compatibility remains
  available for API clients where configured.
- User-owned data queries always include the authenticated user ID.
- Password reset and verification tokens are stored hashed and expire.
- Auth and send routes are rate-limited.
- Custom HTML is sanitized before persistence and delivery.
- Uploads are restricted by count, per-file size, total size, and MIME type.
- Attachment files are deleted after direct or queued delivery attempts.
- Secrets remain in ignored environment files and are never embedded in Vite
  variables.

## Data model

```mermaid
erDiagram
    USER ||--o{ EMAIL : owns
    USER ||--o{ DRAFT : owns
    USER ||--o{ EMAIL_TEMPLATE : owns
    EMAIL {
        ObjectId user
        string from
        string to
        string subject
        string message
        string status
        date scheduledAt
        string queueJobId
    }
    USER {
        ObjectId id
        string name
        string email
        boolean emailVerified
    }
    DRAFT {
        ObjectId user
        string to
        string subject
        string message
        date updatedAt
    }
    EMAIL_TEMPLATE {
        ObjectId user
        string name
        string subject
        string message
        string html
    }
```

## Deployment modes

### Docker + host Nginx + Atlas

```bash
sudo docker compose up -d --build redis backend worker frontend
sudo docker compose ps
curl http://localhost/api/health
curl http://localhost/api/email/health
```

Use this as the primary local-production and cloud deployment mode.

### PM2 + host Nginx + Atlas

Run the backend and worker with `ecosystem.config.cjs`, build the frontend,
and let Nginx serve the generated assets. Do not run the PM2 backend and
Docker backend simultaneously on port 5000.

### Docker + local MongoDB

Set `DB_SOURCE=local`, then run:

```bash
sudo docker compose --profile local-db up -d --build redis mongodb backend worker frontend
```

This mode is for testing and development, not the default production setup.

## Operational commands

```bash
# Status and logs
sudo docker compose ps
sudo docker compose logs --tail=200 backend worker

# Rebuild after source changes
sudo docker compose up -d --build redis backend worker frontend

# Stop Quick Mail but leave host Nginx running
sudo docker compose down

# Validate configuration
docker compose config --quiet
sudo nginx -t
```

## Backup and recovery

- Enable MongoDB Atlas automated backups and test restoration periodically.
- Back up Redis only when queue recovery requirements justify it; queued jobs
  should be safely retryable.
- Back up uploaded attachments or migrate them to S3-compatible object
  storage before public production use.
- Never use `docker compose down -v` on a host whose named volumes contain
  data that has not been backed up.
- Rotate MongoDB, Gmail, Redis, and JWT secrets after exposure.

## Validation

```bash
find backend -name '*.js' -print0 | xargs -0 -n1 node --check
(cd frontend && npm run lint && npm run build)
docker compose config --quiet
git diff --check
```

The operational deployment guide remains in `DEPLOYMENT.md`, Docker-specific
commands remain in `DOCKER.md`, and this file is the architecture reference.
