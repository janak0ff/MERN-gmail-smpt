# 🚀 Quick Mail - Complete Deployment Guide

Deploy to: **https://quickmail.janakkumarshrestha0.com.np/**

---

### Domain Setup
- Domain: `quickmail.janakkumarshrestha0.com.np`
- DNS A record pointing to your server IP
- Verify: `nslookup quickmail.janakkumarshrestha0.com.np`

---

## Clone Repository

```bash
sudo git clone https://github.com/janak0ff/MERN-gmail-smpt.git quickmail
cd quickmail
```

## Configure Environment


```bash
nano .env
```

**Content:**
```env
# Gmail SMTP Configuration
GMAIL_USER=<email>@gmail.com
GMAIL_APP_PASSWORD=<app_password>

# Frontend API URL
VITE_API_URL=https://quickmail.janakkumarshrestha0.com.np/api
```

---

```bash
nano backend/.env
```

**Content:**
```env                                                                          
PORT=5000

# Database Configuration
DB_SOURCE=cloud # Options: local, cloud

MONGODB_URI_LOCAL=mongodb://localhost:27017/mern_smtp
MONGODB_URI_CLOUD=mongodb+srv://<db_user>:<password>@cluster0.uahk9ix.mongodb.net/mern_smtp?retryWrites=true&w=majority

# Legacy/Fallback (Optional)
MONGODB_URI=mongodb://localhost:27017/mern_smtp

# Gmail SMTP Configuration
GMAIL_USER=<email>@gmail.com
GMAIL_APP_PASSWORD=<app_password>

NODE_ENV=production

CLIENT_URL=https://quickmail.janakkumarshrestha0.com.np
```

> Get Gmail App Password: https://myaccount.google.com/apppasswords


---

```bash
nano frotend/.env
```

**Content:**
```env
VITE_API_URL=https://quickmail.janakkumarshrestha0.com.np/api
```

---

## PM2 Deployment

## Install Node.js , npm and pm2
```bash
npm install -g pm2
pm2 --version
```

## Install MongoDB (Optional - Local)

## Setup Backend

```bash
cd quickmil/backend
# Install dependencies
npm install --production

# Start with PM2
pm2 start npm --name backend -- run dev


cd quickmail/frontend

# Install dependencies
npm install

pm2 start npm --name frontend -- run dev

# Save PM2 list
pm2 save

# Setup auto-start
pm2 startup systemd
# Run the command it outputs
pm2 status
```

---

## Setup webserver (nginx)
```bash
sudo apt install -y nginx
sudo systemctl enable --now nginx
```

## Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/quickmail
```

**Content:**
```nginx
server {
    listen 80;
    server_name quickmail.janakkumarshrestha0.com.np;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
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

## Install SSL Certificate

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d quickmail.janakkumarshrestha0.com.np

# Test auto-renewal
sudo certbot renew --dry-run
```

**Test:**
- Health check: https://quickmail.janakkumarshrestha0.com.np/api/email/health
- Send email
- View history
- Check analytics

---


# Quick Reference

## PM2
```bash
pm2 start                     # Start
pm2 stop all                  # Stop
pm2 delete all 
pm2 describe backend
pm2 flush 
pm2 logs                      # Logs
pm2 status                    # Status
pm2 restart all                   # Restart
pm2 monit                     # Monitor
```
