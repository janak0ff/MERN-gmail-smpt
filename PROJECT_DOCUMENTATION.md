# Quick Mail Project Documentation

This document is the authoritative guide for the current Quick Mail implementation,
local development setup, Docker deployment, production hardening, and operations.

## 1. Product overview

Quick Mail is a MERN email delivery application:

- React 19 + Vite frontend.
- Express + Node.js backend.
- MongoDB Atlas or optional local MongoDB.
- Nodemailer with Gmail SMTP/App Password.
- Nginx for production static hosting and API reverse proxying.
- Docker Compose for containerized production deployment.

The application supports rich-text email composition, multiple recipients,
attachments, delivery history, statistics, filtering, dark mode, and Ghost Mode.
Ghost Mode sends without storing the message on the server; the browser stores
its local history in `localStorage`.

## 2. Repository structure

```text
.
├── backend/
│   ├── models/Email.js             MongoDB email schema
│   ├── routes/email.js             Send, history, stats, health routes
│   ├── services/emailService.js    SMTP, formatting, persistence, statistics
│   ├── server.js                   Express startup and MongoDB lifecycle
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

## 7. Docker image design

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
| `GET` | `/stats/summary` | Delivery statistics |
| `GET` | `/health` | Backend and MongoDB readiness |
| `GET` | `/health/check` | SMTP connectivity check |
| `GET` | `/:id` | Fetch one stored email |

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
- [x] Backend readiness and graceful shutdown implemented.
- [x] Frontend lint and production build passing.
- [ ] Rotate any credentials exposed during setup.
- [ ] Configure SPF, DKIM, and DMARC for custom-domain sending.
- [ ] Add automated test coverage before external production launch.
