# Quick Mail Project Documentation

This document is the authoritative guide for the current Quick Mail implementation,
local development setup, Docker deployment, production hardening, and operations.
See `ARCHITECTURE.md` for system diagrams, request flows, service boundaries,
data relationships, and deployment topology.

## 1. Product overview

Quick Mail is a MERN email delivery application:

- React 19 + Vite frontend.
- Express + Node.js backend.
- MongoDB Atlas or optional local MongoDB.
- Nodemailer with Gmail SMTP/App Password.
- Nginx for production static hosting and API reverse proxying.
- Docker Compose for containerized production deployment.
- Redis/BullMQ for durable queued and scheduled email delivery.

The application supports rich-text email composition, multiple recipients,
attachments, delivery history, statistics, filtering, dark mode, and Ghost Mode.
Ghost Mode sends without storing the message on the server; the browser stores
its local history in `localStorage`.

## 2. Repository structure

```text
.
├── backend/
│   ├── models/Email.js             MongoDB email schema
│   ├── models/User.js              Account and password metadata
│   ├── models/Draft.js             User-owned drafts
│   ├── models/EmailTemplate.js     User-owned reusable templates
│   ├── routes/auth.js              Registration and account security
│   ├── routes/email.js             Send, history, stats, scheduling, health
│   ├── routes/drafts.js            Draft CRUD and autosave
│   ├── routes/templates.js         Template CRUD
│   ├── services/emailService.js    SMTP, formatting, persistence, statistics
│   ├── server.js                   Express startup and MongoDB lifecycle
│   ├── queue/emailQueue.js         BullMQ queue connection
│   ├── workers/emailWorker.js      Scheduled delivery worker
│   ├── Dockerfile                  Multi-stage production image
│   ├── .dockerignore
│   ├── .env                        Local secret configuration; ignored by Git
│   └── test-mongodb.js             Atlas connectivity/read-write diagnostic
├── frontend/
│   ├── src/                        React application
│   ├── Dockerfile                  Vite build + Nginx runtime image
│   ├── nginx.conf                  Docker Nginx configuration
│   ├── .env                        Development API URL
│   └── .env.production             Production same-origin API URL
├── docker-compose.yml              Backend + frontend + optional MongoDB
├── ARCHITECTURE.md                 Mermaid architecture and request flows
├── backend/queue/emailQueue.js     BullMQ queue connection and defaults
├── backend/workers/emailWorker.js  Separate email delivery worker
├── nginx.local.conf                Host Nginx localhost production config
├── nginx.cloud.conf                Host Nginx cloud/domain template
├── ecosystem.config.cjs            PM2 production process definition
├── install_node.sh                 Debian/RHEL Node.js installer
├── install_mongodb.sh              Debian/RHEL MongoDB installer
├── DOCKER.md                       Docker quick-start guide
├── DEPLOYMENT.md                   Domain/SSL deployment reference
└── README.md                       Product and API overview
```

The repository intentionally excludes `node_modules`, build output, secrets,
logs, and uploaded files from version control.

The installation scripts support Debian/Ubuntu and RHEL-family systems. They
default to Node.js 20 and MongoDB 7.0 and are safe to rerun:

```bash
sudo ./install_node.sh
sudo ./install_mongodb.sh
```

Override the defaults when required:

```bash
sudo NODE_MAJOR=22 ./install_node.sh
sudo MONGODB_MAJOR=8.0 ./install_mongodb.sh
```

## 3. Environment configuration

### Backend

Create or edit the ignored file `backend/.env`:

```env
PORT=5000
NODE_ENV=production
DB_SOURCE=cloud
MONGODB_URI_CLOUD=mongodb+srv://<user>:<url-encoded-password>@<cluster>/<database>?retryWrites=true&w=majority&appName=<app>
GMAIL_USER=<gmail-address>
GMAIL_APP_PASSWORD=<gmail-app-password>
REDIS_URL=redis://redis:6379
EMAIL_QUEUE_NAME=email-delivery
QUEUE_CONCURRENCY=2
QUEUE_MAX_ATTEMPTS=5
QUEUE_BACKOFF_MS=5000
CLIENT_URL=http://localhost:3000
```

Use `DB_SOURCE=local` and `MONGODB_URI_LOCAL` only when using the optional
local MongoDB Compose profile. Never commit `backend/.env`.

### Frontend

Development uses:

```env
VITE_API_URL=http://localhost:5000/api
```

Production builds use same-origin routing:

```env
VITE_API_URL=/api
```

The production value is required for the Docker Nginx `/api` reverse proxy and
the host Nginx localhost configuration.

### Secret handling

- Rotate any password or app password that has been exposed.
- URL-encode reserved characters in MongoDB credentials.
- Do not put MongoDB or Gmail credentials in Vite variables; `VITE_*` values
  are embedded into browser assets.
- Do not publish `.env` files, Docker logs, or uploaded attachments.

## 4. Running locally in development

Start the backend:

```bash
cd backend
npm install
npm run dev
```

Start the frontend in another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

The backend API is available at `http://localhost:5000/api`. Its readiness
endpoint is:

```bash
curl http://localhost:5000/api/email/health
```

## 5. Running the production build through host Nginx

Build the frontend:

```bash
cd frontend
npm run build
```

The host Nginx configuration is in `nginx.local.conf`. It serves
`/var/www/mern-gmail-smpt` and proxies `/api/` to `127.0.0.1:5000`.

Install and configure it on an Omarchy/Arch host according to the local Nginx
package layout, then:

```bash
sudo mkdir -p /var/www/mern-gmail-smpt
sudo cp -r frontend/dist/. /var/www/mern-gmail-smpt/
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx
```

Run the backend as a production process:

```bash
cd backend
NODE_ENV=production npm start
```

Open `http://localhost`. Verify the reverse proxy with:

```bash
curl http://localhost/api/email/health
```

## 6. Running with Docker Compose

The recommended local production deployment uses MongoDB Atlas:

### Queue operations

Redis is included in Compose and has a healthcheck. The API enqueues scheduled
messages; the separate worker consumes them, retries transient failures with
exponential backoff, and removes attachment files after completion or the final
failed attempt.

Start the application, Redis, and worker:

```bash
docker compose up -d --build redis backend worker frontend
docker compose ps
docker compose logs -f worker
```

Stop the stack without deleting queue data:

```bash
docker compose stop
```

Stop and remove containers (named Redis/MongoDB volumes remain):

```bash
docker compose down
```

To remove persisted Redis queue data as well, use:

```bash
docker compose down -v
```

Schedule an authenticated message with `POST /api/email/schedule` using the
same multipart fields as `/api/email/send` plus an ISO-8601 `scheduledAt`.
Cancel it with `DELETE /api/email/scheduled/:id`; both operations are scoped to
the authenticated user.

```bash
sudo docker compose up -d --build backend frontend
sudo docker compose ps
sudo docker compose logs -f backend
```

Open `http://localhost:3000`. Verify:

```bash
curl http://localhost:5000/api/email/health
```

Expected backend logs include:

```text
MongoDB connected successfully (cloud)
SMTP connection verified successfully
```

Stop the stack:

```bash
sudo docker compose down
```

The optional local MongoDB service is behind the `local-db` profile:

```bash
# Set DB_SOURCE=local in backend/.env first.
sudo docker compose --profile local-db up -d --build
```

The Docker frontend is built with `VITE_API_URL=/api`; its Nginx container
proxies `/api` to the backend service on the Compose network.

### Final local Docker and host Nginx setup

The local production setup uses MongoDB Atlas and separates the application
from the host Nginx lifecycle:

| Component | Address | Role |
|---|---|---|
| Host Nginx | `http://localhost/` | Public entry point and reverse proxy |
| Docker frontend | `http://localhost:3000` | React production build |
| Docker backend | `http://localhost:5000` | Express API |
| MongoDB Atlas | Cloud URI | Active database |

The active database selection in the ignored `backend/.env` is:

```env
DB_SOURCE=cloud
MONGODB_URI_CLOUD=mongodb+srv://<user>:<url-encoded-password>@<cluster>/<database>
```

Host Nginx uses the separate file
`/etc/nginx/conf.d/mern-gmail-smpt.conf`. It proxies `/` to Docker port 3000
and `/api/` to Docker port 5000. The main Nginx configuration must include
`conf.d/*.conf` inside its `http {}` block.

Start and verify the Atlas-backed application:

```bash
sudo docker compose up -d --build backend frontend
sudo docker compose ps
curl http://localhost/api/email/health
```

Stop only the MERN application while leaving Nginx running:

```bash
sudo docker compose down
```

Compose services use `restart: "no"`, so Docker will not start this
application after a system reboot or Docker daemon restart. To disable this
application's Nginx route without stopping Nginx:

```bash
sudo mv /etc/nginx/conf.d/mern-gmail-smpt.conf \
  /etc/nginx/conf.d/mern-gmail-smpt.conf.disabled
sudo nginx -t && sudo systemctl reload nginx
```

## 7. Security and operations

The API uses multi-user JWT authentication. Register and sign in through the
frontend; protected send, history, statistics, email-detail, and SMTP-health
endpoints require a bearer token. Set a unique high-entropy `JWT_SECRET` in
every deployment and never commit it.

Attachments are limited to five files, 10 MB per file, 25 MB total, and an
allowlist of common document, image, archive, and text MIME types. Temporary
upload files are removed after the send attempt. The Docker services bind only
to `127.0.0.1`; public traffic should enter through Nginx.

The application exposes:

```text
GET /api/health          liveness check (no authentication)
GET /api/email/health    MongoDB readiness check (no authentication)
GET /api/email/health/check  SMTP check (authentication required)
```

Run the validation checks locally or in CI:

```bash
(cd backend && npm ci && node --check server.js && node --check routes/email.js)
(cd frontend && npm ci && npm run lint && npm run build)
docker compose config --quiet
```

## 8. Docker image design

### Backend

`backend/Dockerfile` uses two stages:

1. `dependencies`: installs production dependencies with `npm ci --omit=dev`.
2. `runtime`: copies only production dependencies and application files.

The runtime image excludes development dependencies, npm cache, and ignored
diagnostic files.

### Frontend

`frontend/Dockerfile` uses two stages:

1. `build`: installs dependencies and generates Vite assets.
2. Nginx runtime: serves only the generated `dist` files.

Both services have health checks. Compose starts the frontend only after the
backend health check passes.

## 8. Backend behavior and reliability

- Helmet adds security headers.
- Global rate limiting protects API requests.
- Email sending is limited to 10 requests per IP per 15 minutes.
- Uploads are limited to 10 MB per file.
- Recipients may be separated by commas or semicolons.
- Basic recipient syntax validation happens before sending.
- Unreliable mailbox SMTP probing was removed; the Gmail delivery response is
  authoritative and prevents valid Outlook/custom-domain addresses from being
  rejected by false timeouts or typo detection.
- Non-Ghost messages are saved as `pending`, then marked `sent` or `failed`.
- MongoDB connection retries are controlled and use a 10-second server selection
  timeout.
- Readiness returns HTTP 503 when MongoDB is disconnected.
- SIGTERM and SIGINT close the HTTP server and MongoDB connection gracefully.

## 9. API reference

Base URL: `/api/email`

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/send` | Send an email with optional attachments |
| `GET` | `/history` | Paginated, filtered email history |
| `GET` | `/history/export.csv` | Authenticated CSV export using the same filters |
| `DELETE` | `/history/:id` | Delete one history entry owned by the current user |
| `GET` | `/stats/summary` | Delivery statistics |
| `GET` | `/health` | Backend and MongoDB readiness |
| `GET` | `/health/check` | SMTP connectivity check |
| `GET` | `/:id` | Fetch one stored email |

Additional authenticated bases:

- `/api/templates`: user-scoped template list, create, update, and delete.
- `/api/drafts`: user-scoped draft CRUD plus `POST /autosave` for debounced compose saves.
- History queries are limited to `EMAIL_RETENTION_DAYS` (90 days by default), clamp future dates,
  and safely escape search expressions.

Example health response:

```json
{
  "success": true,
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-09-30T00:00:00.000Z"
}
```

## 10. Validation and maintenance commands

Run before a production rebuild:

```bash
node --check backend/server.js
node --check backend/routes/email.js
cd frontend && npm run lint
cd frontend && npm run build
cd .. && docker compose config --quiet
```

Test Atlas database authentication and read/write access:

```bash
cd backend
node test-mongodb.js
```

Inspect runtime status:

```bash
sudo docker compose ps
sudo docker compose logs --tail=200 backend
curl http://localhost:5000/api/email/health
```

## 11. Deliverability notes

Successful SMTP submission does not guarantee Inbox placement. Gmail, Outlook,
and other providers independently classify messages.

For better deliverability:

- Use a real subject and useful message body.
- Avoid repeated identical test messages.
- Ask recipients to move messages from Spam and add the sender to contacts.
- Configure SPF, DKIM, and DMARC when sending from a custom domain.
- Keep sender identity consistent.
- Rotate exposed Gmail app passwords immediately.

## 12. Current production checklist

- [x] MongoDB Atlas connection configured and verified.
- [x] Gmail SMTP connection verified.
- [x] Email history persisted in MongoDB.
- [x] Multiple recipients supported.
- [x] Docker multi-stage builds enabled.
- [x] Docker Compose Atlas deployment supported.
- [x] Optional local MongoDB profile available.
- [x] Nginx host and container configurations available.
- [x] Multi-user authentication and account recovery available.
- [x] Sanitized custom HTML email content.
- [x] Redis/BullMQ scheduled delivery and retry worker.
- [x] User-scoped drafts, templates, search, export, and deletion.
- [x] CI validation workflow available.
- [x] Backend readiness and graceful shutdown implemented.
- [x] Frontend lint and production build passing.
- [ ] Rotate any credentials exposed during setup.
- [ ] Configure SPF, DKIM, and DMARC for custom-domain sending.
- [ ] Add automated test coverage before external production launch.
