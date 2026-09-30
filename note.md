• Docker:  sudo docker compose up -d --build backend frontend 
• PM2/Nginx:  pm2 start ecosystem.config.cjs , build the frontend, copy  dist , and enable  nginx.cloud.conf .



cd /home/jack/MERN-gmail-smpt
sudo docker compose --profile local-db up -d --build mongodb backend frontend

This starts:

• MongoDB:  mongodb:27017 
• Backend API:  http://localhost:5000 
• Frontend:  http://localhost:3000 

Check the containers:

sudo docker compose ps

Check logs:

sudo docker compose logs -f backend

Verify the backend health:

curl http://localhost:5000/api/email/health

Open the application at:

http://localhost:3000

To stop the application:

sudo docker compose --profile local-db down

To stop it and delete the local MongoDB data volume:

sudo docker compose --profile local-db down -v

Do not use  down -v  if you want to preserve your local email history.


sudo docker compose --profile local-db up -d --build mongodb backend frontend