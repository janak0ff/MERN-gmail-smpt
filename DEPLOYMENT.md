# Quick Mail Production Deployment

This guide covers both supported cloud deployment modes:

1. Docker Compose: frontend and backend containers.
2. Without Docker: PM2 runs the backend and Nginx serves the built frontend.

Both modes use MongoDB Atlas and Gmail SMTP. Do not run both modes on the same
host ports at the same time.

## 1. Cloud prerequisites

- A Linux cloud VM with a public IPv4 address.
- DNS `A` records pointing your domain to the VM.
- Node.js 20+ and npm for the non-Docker deployment.
- Docker Engine and Docker Compose for the container deployment.
- Nginx and Certbot for HTTPS.
- A MongoDB Atlas database user and an IP access-list entry for the VM.
- A Gmail account with 2-Step Verification and an App Password.

Open only the required firewall ports:

- TCP 22 for SSH, restricted to administration IPs where possible.
- TCP 80 for HTTP/Certbot.
- TCP 443 for HTTPS.

Do not expose MongoDB port 27017 or backend port 5000 publicly when Nginx is
the public entry point.

## 2. Clone and configure

```bash
git clone https://github.com/janak0ff/MERN-gmail-smpt.git quick-mail
cd quick-mail
git switch feature
```

Create `backend/.env`; never commit it:

```env
PORT=5000
NODE_ENV=production
DB_SOURCE=cloud
MONGODB_URI_CLOUD=mongodb+srv://<user>:<url-encoded-password>@<cluster>/<database>?retryWrites=true&w=majority&appName=quick-mail
GMAIL_USER=<gmail-address>
GMAIL_APP_PASSWORD=<gmail-app-password>
CLIENT_URL=https://your-domain.example
```

URL-encode reserved characters in the MongoDB username/password. Add the VM
public IP to MongoDB Atlas Network Access. Use a least-privileged database
user. Rotate credentials if they are ever exposed.

## 3. Pre-deployment validation

```bash
cd backend
npm ci --omit=dev
node test-mongodb.js
cd ..

cd frontend
npm ci
npm run lint
npm run build
cd ..

node --check backend/server.js
node --check backend/routes/email.js
docker compose config --quiet
```

The MongoDB diagnostic must report both a successful connection and successful
test document write.

## 4. Option A: Docker Compose deployment

Build and start the Atlas-backed services:

```bash
sudo docker compose up -d --build backend frontend
sudo docker compose ps
sudo docker compose logs --tail=200 backend
```

The expected backend logs are:

```text
MongoDB connected successfully (cloud)
SMTP connection verified successfully
```

The application is available on port 3000 by default:

```bash
curl http://127.0.0.1:3000/api/email/health
```

For a public domain, either expose Docker frontend port 80 directly or put
host Nginx in front of it and proxy the domain to `127.0.0.1:3000`. Do not
also run the PM2 backend on port 5000.

Useful operations:

```bash
sudo docker compose ps
sudo docker compose logs -f backend
sudo docker compose restart backend
sudo docker compose up -d --build
sudo docker compose down
```

The optional local MongoDB profile is for local-only use:

```bash
# Set DB_SOURCE=local in backend/.env first.
sudo docker compose --profile local-db up -d --build
```

## 5. Option B: PM2 backend + Nginx frontend

Install dependencies and build the frontend:

```bash
cd backend
npm ci --omit=dev
cd ../frontend
npm ci
npm run lint
npm run build
cd ..
```

Install PM2:

```bash
sudo npm install --global pm2
```

Start the backend using the included production configuration:

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd
# Run the sudo command printed by pm2 startup.
pm2 status
pm2 logs quick-mail-backend
```

`ecosystem.config.cjs` runs `backend/server.js` with `NODE_ENV=production`.
The backend itself loads `backend/.env`.

Copy the built frontend:

```bash
sudo mkdir -p /var/www/quick-mail/frontend/dist
sudo cp -r frontend/dist/. /var/www/quick-mail/frontend/dist/
```

Install the cloud Nginx template:

```bash
sudo cp nginx.cloud.conf /etc/nginx/conf.d/quick-mail.conf
sudo sed -i 's/your-domain.example/your-real-domain.example/g' \
  /etc/nginx/conf.d/quick-mail.conf
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx
```

Verify the HTTP deployment:

```bash
curl http://127.0.0.1/api/email/health
curl -I https://your-real-domain.example/
```

When frontend code changes, rebuild and copy the new assets:

```bash
cd frontend
npm run build
cd ..
sudo cp -r frontend/dist/. /var/www/quick-mail/frontend/dist/
```

## 6. HTTPS with Certbot

After DNS resolves to the VM and port 80 is reachable:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-real-domain.example
sudo certbot renew --dry-run
```

Confirm the API through HTTPS:

```bash
curl https://your-real-domain.example/api/email/health
```

Set `CLIENT_URL` in `backend/.env` to the exact HTTPS origin and restart:

```bash
pm2 restart quick-mail-backend --update-env
```

For Docker, rebuild the frontend only when its build-time API URL changes.
The included Docker frontend uses same-origin `/api` routing.

## 7. Health checks and rollback

The readiness endpoint returns HTTP 200 only when MongoDB is connected:

```bash
curl -i https://your-real-domain.example/api/email/health
```

Expected response:

```json
{
  "success": true,
  "status": "healthy",
  "database": "connected"
}
```

PM2 rollback:

```bash
git log --oneline -5
git checkout <known-good-commit>
npm ci --prefix backend --omit=dev
npm ci --prefix frontend
npm run build --prefix frontend
sudo cp -r frontend/dist/. /var/www/quick-mail/frontend/dist/
pm2 restart quick-mail-backend --update-env
```

Docker rollback:

```bash
git checkout <known-good-commit>
sudo docker compose up -d --build
```

## 8. Production security and operations

- Keep `.env` files outside Git and restrict permissions:
  `chmod 600 backend/.env`.
- Rotate Gmail App Passwords and Atlas passwords after exposure.
- Restrict Atlas Network Access to the VM IP.
- Do not open ports 27017 or 5000 to the Internet.
- Back up MongoDB Atlas according to the selected Atlas plan.
- Monitor `pm2 logs`, Nginx logs, Docker logs, disk usage, and upload storage.
- Configure SPF, DKIM, and DMARC for custom-domain sending.
- Email acceptance by Gmail does not guarantee Inbox placement.
- Remove old Docker images periodically with a reviewed cleanup policy.
