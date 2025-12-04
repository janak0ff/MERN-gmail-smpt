# Quick Mail Deployment Guide
## Deploy to Ubuntu Cloud Server with Docker

**Server:** ubuntu@202.51.74.106  
**Domain:** https://quickmail.janakkumarshrestha0.com.np/

---

## Step 1: Connect to Your Server

```bash
ssh ubuntu@202.51.74.106
```

---

## Step 2: Update System and Install Prerequisites

```bash
# Update package list
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y ca-certificates curl gnupg lsb-release git
```

---

## Step 3: Install Docker

```bash
# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add your user to docker group (to run without sudo)
sudo usermod -aG docker $USER

# Apply group changes (logout and login, or use this)
newgrp docker

# Verify Docker installation
docker --version
docker compose version
```

---

## Step 4: Install Nginx (for reverse proxy)

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## Step 5: Clone Your Repository

```bash
cd ~
git clone https://github.com/janak0ff/MERN-gmail-smpt.git
cd MERN-gmail-smpt
```

---

## Step 6: Set Up Environment Variables

```bash
# Create backend .env file
nano backend/.env
```

**Paste this content (update with your actual values):**

```env
# Server Configuration
PORT=5000
NODE_ENV=production
CLIENT_URL=https://quickmail.janakkumarshrestha0.com.np

# Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/quickmail?retryWrites=true&w=majority

# Gmail SMTP Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-digit-app-password
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

---

## Step 7: Update docker-compose.yml for Production

```bash
nano docker-compose.yml
```

**Replace with this production-ready configuration:**

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    env_file:
      - ./backend/.env
    volumes:
      - ./backend/uploads:/app/uploads
    dns:
      - 8.8.8.8
      - 8.8.4.4
    restart: unless-stopped
    networks:
      - quickmail-network

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - quickmail-network

networks:
  quickmail-network:
    driver: bridge
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

---

## Step 8: Update Frontend API URL

```bash
# Create frontend .env file
nano frontend/.env
```

**Add this:**

```env
VITE_API_URL=https://quickmail.janakkumarshrestha0.com.np/api
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

---

## Step 9: Start Docker Daemon and Build Containers

```bash
# Start the Docker service
sudo systemctl start docker

# Enable Docker to start on boot
sudo systemctl enable docker

# Verify Docker is running
sudo systemctl status docker

# Build and start containers
docker compose up -d --build

# If you get permission errors, use sudo
# sudo docker compose up -d --build

# Check if containers are running
docker compose ps

# View logs if needed
docker compose logs -f
```

**Note:** The `version` field in docker-compose.yml is deprecated. You can remove it:
```bash
sed -i '1d' docker-compose.yml
```

---

## Step 10: Configure Nginx Reverse Proxy

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/quickmail
```

**Paste this configuration:**

```nginx
server {
    listen 80;
    server_name quickmail.janakkumarshrestha0.com.np;

    # Redirect HTTP to HTTPS (after SSL is set up)
    # return 301 https://$server_name$request_uri;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/quickmail /etc/nginx/sites-enabled/

# Remove default site if exists
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## Step 11: Configure DNS (Do this FIRST before SSL)

**On your DNS provider (where you manage janakkumarshrestha0.com.np):**

Add an A record:
- **Host:** `quickmail`
- **Type:** `A`
- **Value:** `202.51.74.106`
- **TTL:** `3600` (or Auto)

**Wait 5-10 minutes for DNS propagation**

Verify DNS is working:
```bash
# On your local machine or server
nslookup quickmail.janakkumarshrestha0.com.np
# Should return 202.51.74.106
```

---

## Step 12: Install SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d quickmail.janakkumarshrestha0.com.np

# Follow the prompts:
# - Enter your email address
# - Agree to terms of service
# - Choose whether to redirect HTTP to HTTPS (select 2 for redirect)

# Certbot will automatically update your Nginx configuration for HTTPS
```

---

## Step 13: Set Up Auto-Renewal for SSL

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up a cron job for renewal
# Verify it exists
sudo systemctl status certbot.timer
```

---

## Step 14: Configure Firewall

```bash
# Enable UFW firewall
sudo ufw enable

# Allow necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Check status
sudo ufw status
```

---

## Step 15: Verify Deployment

```bash
# Check Docker containers are running
docker compose ps

# Check Nginx is running
sudo systemctl status nginx

# Check application logs
docker compose logs backend
docker compose logs frontend

# Test the application
curl http://localhost:3000
curl http://localhost:5000/api/email/stats/summary
```

**Visit:** https://quickmail.janakkumarshrestha0.com.np/

---

## Useful Commands for Management

### View Logs
```bash
# All containers
docker compose logs -f

# Specific container
docker compose logs -f backend
docker compose logs -f frontend
```

### Restart Containers
```bash
# Restart all
docker compose restart

# Restart specific
docker compose restart backend
docker compose restart frontend
```

### Update Application
```bash
cd ~/MERN-gmail-smpt

# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose down
docker compose up -d --build
```

### Stop Containers
```bash
docker compose down
```

### Check Resource Usage
```bash
docker stats
```

---

## Troubleshooting

### If Docker daemon is not running:
```bash
# Start Docker service
sudo systemctl start docker

# Enable Docker to start on boot
sudo systemctl enable docker

# Check status
sudo systemctl status docker

# If still having issues, restart Docker
sudo systemctl restart docker
```

### If containers don't start:
```bash
# Check logs
docker compose logs

# Check if ports are already in use
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :5000
```

### If Nginx fails:
```bash
# Check configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### If SSL certificate fails:
```bash
# Make sure DNS is pointing to your server
nslookup quickmail.janakkumarshrestha0.com.np

# Check if port 80 is accessible
curl -I http://quickmail.janakkumarshrestha0.com.np
```

### Backend can't connect to MongoDB:
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0` or your server IP
- Check connection string in `backend/.env`
- Test connection: `docker compose logs backend`

---

## Security Best Practices

1. **Change default SSH port:**
```bash
sudo nano /etc/ssh/sshd_config
# Change Port 22 to something else like 2222
sudo systemctl restart sshd
# Update firewall: sudo ufw allow 2222/tcp
```

2. **Keep system updated:**
```bash
sudo apt update && sudo apt upgrade -y
```

3. **Monitor logs regularly:**
```bash
docker compose logs -f
sudo tail -f /var/log/nginx/access.log
```

4. **Set up regular backups** for your MongoDB database

---

## Success Checklist

- [ ] Docker and Docker Compose installed
- [ ] Repository cloned
- [ ] Environment variables configured
- [ ] DNS A record created and propagated
- [ ] Docker containers running
- [ ] Nginx configured and running
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Application accessible at https://quickmail.janakkumarshrestha0.com.np/

---

**Congratulations! Your Quick Mail application is now live! 🚀**
