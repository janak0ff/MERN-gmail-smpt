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





---



The app is working, but these are the highest-value improvements still worth making.

Highest priority

1. Add authentication and authorization
• The send, history, statistics, and individual-email endpoints are currently accessible without login.
• A public deployment could allow anyone to send mail through your Gmail account or read email history.
• Add user authentication, protected API routes, and per-user email history.
2. Rotate exposed credentials
• Credentials were previously shared during setup. Rotate the MongoDB and Gmail App Password credentials before any public deployment.
• Keep only placeholders in  .env.example  and documentation.
3. Clean up uploaded attachments
• Uploaded files are stored in  backend/uploads  but are not automatically deleted after sending.
• Add cleanup after successful or failed delivery, or move attachments to object storage such as S3-compatible storage.
• Otherwise disk usage will grow indefinitely.
4. Improve upload security
• Add:
• Maximum number of attachments.
• Maximum total request size.
• MIME-type allowlist.
• Extension validation.
• Filename/content validation.
• Automatic cleanup on validation or SMTP failure.
• Do not expose uploaded files through a public static route.
5. Fix API validation and pagination limits
• Clamp  limit  and  page  values server-side.
• Validate  sortBy  against an allowlist instead of passing arbitrary query values into MongoDB.
• Validate date filters before using them.
• Limit recipient count and subject/message length.
• Return consistent  400 ,  401 ,  403 ,  429 , and  500  response formats.

Reliability and production operations

6. Add structured logging
• Replace scattered  console.log  statements with structured JSON logging using a logger such as Pino.
• Do not log recipient lists, subjects, message content, or SMTP credentials.
• Add request IDs so failures can be traced across Nginx, backend, and SMTP.
7. Improve health checks
• Keep  /health  for process/database readiness.
• Add separate checks for:
• Application liveness.
• MongoDB readiness.
• SMTP readiness.
• Avoid making the Docker container unhealthy only because Gmail SMTP is temporarily unavailable.
8. Add graceful upload and shutdown handling
• Remove incomplete uploads when requests fail.
• Ensure shutdown waits for active email sends before closing MongoDB and the HTTP server.
9. Add backups and retention
• MongoDB Atlas backups should be enabled.
• Define an email-history retention policy.
• Avoid storing complete message bodies and attachment paths forever unless required.
10. Add monitoring

• Monitor:
• Container health.
• Nginx errors.
• MongoDB connection failures.
• SMTP failures.
• Disk usage.
• Memory usage.
• Add alerts before the service becomes unavailable.

Docker and Nginx improvements

11. Do not expose backend and frontend ports publicly

• Bind Docker ports to localhost only:

ports:
  - "127.0.0.1:5000:5000"

ports:
  - "127.0.0.1:3000:80"

   Nginx can still proxy to both ports, but external clients cannot bypass Nginx.

12. Use a Docker secret strategy

• Avoid passing credentials through broadly visible Compose environment configuration where possible.
• Use Docker secrets, an external secret manager, or protected host environment files.

13. Add resource limits

• Set CPU and memory limits for backend and frontend containers.
• Prevent an unexpected upload or SMTP failure loop from exhausting the host.

14. Pin production image versions

• Replace floating tags such as:

node:20-alpine
nginx:alpine

   with controlled versions or digests to make deployments reproducible.

15. Harden Nginx

• Add security headers.
• Add request body and timeout limits.
• Enable gzip or Brotli for static assets.
• Configure access/error log rotation.
• Add HTTPS and HSTS when using a real domain.

Code quality and maintainability

16. Add automated tests

• Backend tests for recipient parsing, validation, health behavior, failure handling, and attachment cleanup.
• Frontend tests for composing, multiple recipients, ghost mode, and API errors.
• Run lint, build, and tests in GitHub Actions.

17. Improve email HTML safety

• The custom HTML field currently accepts arbitrary HTML.
• Either sanitize it with a strict allowlist or clearly restrict it to trusted administrators.
• Add a safe plain-text fallback for every message.

18. Add database indexes and retention-aware queries

• Existing indexes are a good start.
• Add compound indexes for common history queries such as status/date and recipient/date after measuring actual query patterns.

19. Remove stale files

•  note.md  contains old setup instructions, including local MongoDB commands that no longer match the current Atlas-first setup.
• Delete it or replace it with a short pointer to  DOCKER.md  and  PROJECT_DOCUMENTATION.md .

20. Separate deployment modes more clearly

• Keep these as distinct documented modes:
• Docker + host Nginx + Atlas.
• PM2 + host Nginx + Atlas.
• Docker + local MongoDB for testing only.
• Do not run PM2 and Docker backend simultaneously on port 5000.

The most important next implementation batch is: authentication, credential rotation, upload cleanup/security, localhost-only Docker bindings, request validation, and automated tests.