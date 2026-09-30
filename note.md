• Docker:  sudo docker compose up -d --build backend frontend 
• PM2/Nginx:  pm2 start ecosystem.config.cjs , build the frontend, copy  dist , and enable  nginx.cloud.conf .