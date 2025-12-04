# 🚀 Quick Mail - Complete Deployment Guide

Deploy to: **https://quickmail.janakkumarshrestha0.com.np/**

This guide covers **two deployment methods**:
1. **🐳 Docker Deployment** (Recommended)
2. **⚙️ PM2 Native Deployment** (Alternative)

---

## 📋 Prerequisites

### Server Requirements
- Ubuntu 20.04+ or similar Linux distribution
- Minimum: 1GB RAM, 1 CPU core, 20GB disk
- Root or sudo access

### Domain Setup
- Domain: `quickmail.janakkumarshrestha0.com.np`
- DNS A record pointing to your server IP
- Verify: `nslookup quickmail.janakkumarshrestha0.com.np`

---

# 🐳 Method 1: Docker Deployment (Recommended)

## Step 1: Connect to Server

```bash
ssh ubuntu@YOUR_SERVER_IP
```

## Step 2: Install Prerequisites

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essentials
sudo apt install -y ca-certificates curl gnupg git ufw
```

## Step 3: Install Docker

```bash
# Add Docker GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker compose version
```

## Step 4: Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

## Step 5: Clone Repository

```bash
cd /opt
sudo git clone https://github.com/janak0ff/MERN-gmail-smpt.git quickmail
sudo chown -R $USER:$USER /opt/quickmail
cd /opt/quickmail
```

## Step 6: Configure Environment

```bash
# Create backend .env
nano backend/.env
```

**Content:**
```env
PORT=5000

# Use cloud MongoDB for production
DB_SOURCE=cloud

# MongoDB Atlas (REQUIRED)
MONGODB_URI_CLOUD=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/mern_smtp?retryWrites=true&w=majority
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/mern_smtp?retryWrites=true&w=majority

# Gmail SMTP
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password

# Production settings
NODE_ENV=production
CLIENT_URL=https://quickmail.janakkumarshrestha0.com.np
```

> Get Gmail App Password: https://myaccount.google.com/apppasswords

## Step 7: Update docker-compose.yml

```bash
nano docker-compose.yml
```

**Remove or comment out MongoDB service** (using cloud instead):

```yaml
services:
  # mongodb: # Comment out if using cloud MongoDB
  #   ...

  backend:
    env_file:
      - ./backend/.env
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: mern-smtp-backend
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - NODE_ENV=production
    volumes:
      - ./backend/uploads:/app/uploads
    networks:
      - mern-network
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:5000/api/email/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - VITE_API_URL=https://quickmail.janakkumarshrestha0.com.np/api
    container_name: mern-smtp-frontend
    restart: unless-stopped
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - mern-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://127.0.0.1/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

networks:
  mern-network:
    driver: bridge
```

## Step 8: Build and Start Containers

```bash
# Build images
docker compose build

# Start containers
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

## Step 9: Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/quickmail
```

**Content:**
```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name quickmail.janakkumarshrestha0.com.np;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name quickmail.janakkumarshrestha0.com.np;

    # SSL certificates (added by Certbot)
    # ssl_certificate /etc/letsencrypt/live/quickmail.janakkumarshrestha0.com.np/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/quickmail.janakkumarshrestha0.com.np/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000" always;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    client_max_body_size 25M;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/quickmail /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

## Step 10: Install SSL Certificate

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d quickmail.janakkumarshrestha0.com.np

# Test auto-renewal
sudo certbot renew --dry-run
```

## Step 11: Configure Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

## Step 12: Verify Deployment

```bash
# Check containers
docker compose ps

# Test endpoints
curl http://localhost:5000/api/email/health
curl http://localhost:3000

# Visit your site
# https://quickmail.janakkumarshrestha0.com.np
```

---

# ⚙️ Method 2: PM2 Native Deployment

## Step 1-2: Server Setup & Prerequisites

Same as Docker Method (Steps 1-2)

## Step 3: Install Node.js

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version
npm --version
```

## Step 4: Install MongoDB (Optional - Local)

```bash
# Import MongoDB key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
  sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
  https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install
sudo apt update
sudo apt install -y mongodb-org

# Start
sudo systemctl start mongod
sudo systemctl enable mongod
```

> **Note:** For production, use MongoDB Atlas (cloud) instead

## Step 5: Install PM2

```bash
sudo npm install -g pm2
pm2 --version
```

## Step 6: Clone and Setup

```bash
cd /opt
sudo git clone https://github.com/janak0ff/MERN-gmail-smpt.git quickmail
sudo chown -R $USER:$USER /opt/quickmail
cd /opt/quickmail
```

## Step 7: Configure Environment

```bash
nano backend/.env
```

**Content:**
```env
PORT=5000

# Use local or cloud
DB_SOURCE=cloud
# DB_SOURCE=local

# Local MongoDB
MONGODB_URI_LOCAL=mongodb://localhost:27017/mern_smtp

# Cloud MongoDB (recommended)
MONGODB_URI_CLOUD=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/mern_smtp
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/mern_smtp

# Gmail
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password

# Production
NODE_ENV=production
CLIENT_URL=https://quickmail.janakkumarshrestha0.com.np
```

## Step 8: Setup Backend

```bash
cd /opt/quickmail/backend

# Install dependencies
npm install --production

# Create uploads directory
mkdir -p uploads

# Start with PM2
pm2 start npm --name "quickmail-backend" -- start

# Save PM2 list
pm2 save

# Setup auto-start
pm2 startup systemd
# Run the command it outputs

# Check status
pm2 status
pm2 logs quickmail-backend
```

## Step 9: Build Frontend

```bash
cd /opt/quickmail/frontend

# Install dependencies
npm install

# Build with production API URL
VITE_API_URL=https://quickmail.janakkumarshrestha0.com.np/api npm run build

# Build output is in dist/
```

## Step 10: Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

## Step 11: Configure Nginx for PM2

```bash
sudo nano /etc/nginx/sites-available/quickmail
```

**Content:**
```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name quickmail.janakkumarshrestha0.com.np;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name quickmail.janakkumarshrestha0.com.np;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000" always;

    # Serve frontend static files
    root /opt/quickmail/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    client_max_body_size 25M;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/quickmail /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

## Step 12: Install SSL

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d quickmail.janakkumarshrestha0.com.np

# Test renewal
sudo certbot renew --dry-run
```

## Step 13: Configure Firewall

Same as Docker method

## Step 14: Verify

```bash
# PM2 status
pm2 status

# Nginx status
sudo systemctl status nginx

# Visit site
# https://quickmail.janakkumarshrestha0.com.np
```

---

# 🔄 Maintenance Commands

## Docker Deployment

```bash
# View logs
docker compose logs -f
docker compose logs -f backend

# Restart
docker compose restart

# Update
cd /opt/quickmail
git pull
docker compose build
docker compose up -d

# Stop
docker compose down

# Monitor
docker stats
```

## PM2 Deployment

```bash
# PM2 status
pm2 status
pm2 logs quickmail-backend
pm2 monit

# Restart
pm2 restart quickmail-backend

# Update backend
cd /opt/quickmail
git pull
cd backend
npm install --production
pm2 restart quickmail-backend

# Update frontend
cd /opt/quickmail/frontend
npm install
VITE_API_URL=https://quickmail.janakkumarshrestha0.com.np/api npm run build
sudo systemctl reload nginx

# Stop
pm2 stop quickmail-backend
```

---

# 🐛 Troubleshooting

## Check Services

```bash
# Docker
docker compose ps
docker compose logs -f

# PM2
pm2 status
pm2 logs

# Nginx
sudo systemctl status nginx
sudo nginx -t
sudo tail -f /var/log/nginx/error.log

# MongoDB (if local)
sudo systemctl status mongod
```

## Common Issues

### Port Already in Use
```bash
sudo lsof -i :5000
sudo lsof -i :3000
sudo kill -9 <PID>
```

### Permission Denied
```bash
sudo chown -R $USER:$USER /opt/quickmail
chmod 755 /opt/quickmail/backend/uploads
```

### SSL Issues
```bash
sudo certbot renew
sudo certbot certificates
```

### MongoDB Connection
```bash
# Check MongoDB Atlas IP whitelist
# Add 0.0.0.0/0 or your server IP

# Test connection in backend logs
docker compose logs backend
# OR
pm2 logs quickmail-backend
```

### Frontend API Error
```bash
# Rebuild frontend with correct API URL
cd /opt/quickmail/frontend
VITE_API_URL=https://quickmail.janakkumarshrestha0.com.np/api npm run build
```

---

# 🔐 Security Checklist

- [ ] Firewall enabled (UFW)
- [ ] SSL certificate installed
- [ ] Environment variables secured
- [ ] MongoDB authentication (if local)
- [ ] Regular backups configured
- [ ] Nginx security headers
- [ ] Rate limiting enabled
- [ ] System updates scheduled

---

# 📊 Post-Deployment

Access: **https://quickmail.janakkumarshrestha0.com.np**

**Test:**
- Health check: https://quickmail.janakkumarshrestha0.com.np/api/email/health
- Send email
- View history
- Check analytics

---

# 📝 Quick Reference

## Docker
```bash
docker compose up -d          # Start
docker compose down           # Stop
docker compose logs -f        # Logs
docker compose ps             # Status
docker compose build          # Rebuild
```

## PM2
```bash
pm2 start                     # Start
pm2 stop all                  # Stop
pm2 logs                      # Logs
pm2 status                    # Status
pm2 restart                   # Restart
pm2 monit                     # Monitor
```

## Nginx
```bash
sudo systemctl status nginx   # Status
sudo nginx -t                 # Test config
sudo systemctl reload nginx   # Reload
sudo systemctl restart nginx  # Restart
```

---

**🎉 Deployment Complete!**

Choose Docker for easier management or PM2 for more control. Both methods are production-ready.
