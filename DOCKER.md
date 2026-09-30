# Docker Setup Guide

This guide explains how to run the MERN Gmail SMTP application using Docker containers.

## Prerequisites

- Docker Engine 20.10 or higher
- Docker Compose 2.0 or higher

**Installation:**

```bash
# Install Docker on Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

## Quick Start

### 1. Environment Setup

Configure the backend environment file:

```bash
nano backend/.env
```

Edit `backend/.env` and fill in your actual values:

```env
# Use MongoDB Atlas for production
DB_SOURCE=cloud

# If using cloud, add your MongoDB Atlas connection string
MONGODB_URI_CLOUD=mongodb+srv://username:password@cluster.mongodb.net/database

GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
NODE_ENV=production
CLIENT_URL=http://localhost:3000
```

### 2. Build and Run

**Option A: Using Cloud MongoDB Atlas (recommended)**

```bash
# Build and start the Atlas-backed production services.
# Do not use --profile local-db for Atlas.
sudo docker compose up -d --build backend frontend

# View logs
sudo docker compose logs -f
```

**Option B: Using Local MongoDB (Docker)**

```bash
# Set DB_SOURCE=local in backend/.env first.

# Start the optional MongoDB profile and application
sudo docker compose --profile local-db up -d --build
```

### 3. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **MongoDB:** localhost:27017 (if using local)

## Docker Compose Services

The application consists of three services:

1. **mongodb** - MongoDB 7.0 database (optional)
   - Port: 27017
   - Data persisted in Docker volume `mongodb_data`

2. **backend** - Node.js/Express API
   - Port: 5000
   - Uploads stored in `./backend/uploads`

3. **frontend** - React/Vite app served by Nginx
   - Port: 3000 (mapped to container port 80)

## Useful Commands

### Starting and Stopping

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# Stop and remove volumes (⚠️ deletes database data)
docker compose down -v

# Restart a specific service
docker compose restart backend
```

The Compose services intentionally do not use an automatic restart policy.
Start the application explicitly when needed; it will not return after a
system or Docker daemon reboot by itself.

### Running Docker behind host Nginx

Docker exposes the frontend on port 3000 and the backend on port 5000. To
serve the application through host Nginx on port 80, create a separate
configuration file:

```bash
sudo mkdir -p /etc/nginx/conf.d
sudo tee /etc/nginx/conf.d/mern-gmail-smpt.conf > /dev/null <<'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name localhost 127.0.0.1;

    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX
```

Ensure the main Nginx `http {}` block includes the app-specific directory:

```bash
sudo grep -qE '^[[:space:]]*include[[:space:]]+conf\.d/\*\.conf;' /etc/nginx/nginx.conf || \
  sudo sed -i '/^[[:space:]]*http[[:space:]]*{/a\    include conf.d/*.conf;' /etc/nginx/nginx.conf
sudo nginx -t && sudo systemctl reload nginx
```

The public local URL is then `http://localhost/`. Nginx remains running when
the application is stopped, but the URL will return `404` or `502` until the
Docker services are started again.

```bash
# Start the Atlas-backed app
sudo docker compose up -d --build backend frontend

# Stop only this MERN application; Nginx stays running
sudo docker compose down

# Disable this app's Nginx route without stopping Nginx
sudo mv /etc/nginx/conf.d/mern-gmail-smpt.conf \
  /etc/nginx/conf.d/mern-gmail-smpt.conf.disabled
sudo nginx -t && sudo systemctl reload nginx
```

### Viewing Logs

```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongodb
```

### Rebuilding Images

```bash
# Rebuild specific service
docker compose build backend

# Rebuild all services
docker compose build

# Rebuild and restart
docker compose up -d --build
```

### Accessing Containers

```bash
# Execute commands in backend container
docker compose exec backend sh

# Execute commands in MongoDB container
docker compose exec mongodb mongosh

# View backend uploads directory
docker compose exec backend ls -la uploads/
```

### Database Management

```bash
# Backup MongoDB data
docker compose exec mongodb mongodump --out /dump

# Restore MongoDB data
docker compose exec mongodb mongorestore /dump

# Access MongoDB shell
docker compose exec mongodb mongosh mern_smtp
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_SOURCE` | Database source: `local` or `cloud` | `cloud` |
| `MONGODB_URI_CLOUD` | MongoDB Atlas connection string | - |
| `GMAIL_USER` | Gmail address for SMTP | - |
| `GMAIL_APP_PASSWORD` | Gmail app-specific password | - |
| `NODE_ENV` | Environment mode | `production` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `VITE_API_URL` | Backend API URL (build-time) | `http://localhost:5000/api` |

## Switching Between Local and Cloud Database

### To Local MongoDB:

1. Edit `.env`:
   ```env
   DB_SOURCE=local
   ```

2. Restart services:
   ```bash
   sudo docker compose --profile local-db up -d --build
   ```

### To Cloud MongoDB Atlas:

1. Edit `.env`:
   ```env
   DB_SOURCE=cloud
   MONGODB_URI_CLOUD=mongodb+srv://...
   ```

2. Restart backend only:
   ```bash
   sudo docker compose restart backend
   ```

3. (Optional) Stop local MongoDB to save resources:
   ```bash
   sudo docker compose --profile local-db stop mongodb
   ```

## Production Deployment

For production deployment with a custom domain:

1. Update `.env`:
   ```env
   NODE_ENV=production
   CLIENT_URL=https://yourdomain.com
   VITE_API_URL=https://api.yourdomain.com/api
   ```

2. Rebuild frontend with new API URL:
   ```bash
   docker compose build frontend
   ```

3. Use a reverse proxy (Nginx/Traefik) for SSL termination

4. Consider using Docker Swarm or Kubernetes for orchestration

## Troubleshooting

### Backend can't connect to MongoDB

**Symptom:** Backend logs show connection errors

**Solution:**
```bash
# Check MongoDB is running and healthy
docker compose ps mongodb

# Check MongoDB logs
docker compose logs mongodb

# Ensure DB_SOURCE matches your setup
cat .env | grep DB_SOURCE
```

### Frontend can't reach backend

**Symptom:** API calls fail with network errors

**Solution:**
```bash
# Check backend is healthy
docker compose ps backend

# Verify backend logs for errors
docker compose logs backend

# Ensure VITE_API_URL is correct
# Rebuild frontend if changed
docker compose build frontend
docker compose up -d frontend
```

### Port already in use

**Symptom:** "Bind for 0.0.0.0:3000 failed: port is already allocated"

**Solution:**
```bash
# Find process using the port
sudo lsof -i :3000

# Kill the process or change port in docker-compose.yml
# For example, change "3000:80" to "3001:80"
```

### Permission issues with uploads

**Symptom:** Can't upload attachments

**Solution:**
```bash
# Fix permissions on host
sudo chown -R $USER:$USER backend/uploads
chmod -R 755 backend/uploads
```

## Health Checks

All services include health checks:

```bash
# View service health status
docker compose ps

# Manually test backend health
curl http://localhost:5000/api/email/health

# Manually test frontend health
curl http://localhost:3000
```

## Data Persistence

- **MongoDB data:** Stored in Docker volume `mongodb_data`
- **File uploads:** Stored in `./backend/uploads` (host-mounted)

To backup uploads:
```bash
tar -czf uploads-backup.tar.gz backend/uploads/
```

## Clean Up

```bash
# Stop and remove containers
docker compose down

# Remove volumes (⚠️ deletes database)
docker compose down -v

# Remove images
docker compose down --rmi all

# Complete cleanup
docker compose down -v --rmi all
docker volume prune
docker network prune
```

## Support

For issues or questions:
1. Check logs: `docker compose logs -f`
2. Verify environment variables in `.env`
3. Ensure MongoDB is running: `docker compose ps mongodb`
4. Check network connectivity between services
