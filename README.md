# MERN SMTP Application

A full-stack MERN (MongoDB, Express, React, Node.js) application for sending emails via SMTP (Gmail). It features a modern, responsive UI, email history tracking, and analytics.

## Features
- **Send Emails:** Rich text editor, file attachments, and HTML support.
- **Email History:** Track sent, failed, and pending emails with a searchable list.
- **Analytics:** Dashboard with delivery stats and performance charts.
- **Responsive UI:** Premium, glassmorphism-inspired design.
- **Dockerized:** Easy deployment with Docker Compose.

## Prerequisites
- Node.js (v14 or higher)
- MongoDB (Local or Atlas)
- Docker & Docker Compose (optional, for containerized run)
- A Gmail account with an **App Password** generated.

---

## 1. Environment Configuration

Create a `.env` file in the `backend` directory (`backend/.env`) with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/mern-smtp

# SMTP Configuration (Gmail)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-digit-app-password
```

> **Note:** To generate a Gmail App Password, go to [Google Account > Security > 2-Step Verification > App passwords](https://myaccount.google.com/apppasswords).

---

## 2. Run with Docker (Recommended)

The easiest way to run the application is using Docker. This will set up both the frontend and backend in containers.

1.  **Build and Start:**
    Open a terminal in the project root and run:
    ```bash
    docker-compose up --build
    ```

2.  **Access the App:**
    - **Frontend:** [http://localhost:3000](http://localhost:3000)
    - **Backend API:** [http://localhost:5000](http://localhost:5000)

3.  **Stop the App:**
    Press `Ctrl+C` or run:
    ```bash
    docker-compose down
    ```

---

## 3. Run Natively (Without Docker)

If you prefer to run the application locally on your machine:

### Backend Setup
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the server:
    ```bash
    npm start
    ```
    The backend will run on `http://localhost:5000`.

### Frontend Setup
1.  Open a new terminal and navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    The frontend will run on `http://localhost:3000` (or the port shown in the terminal).

---

## Project Structure

```
MERN-gmail-smpt/
├── backend/                 # Node.js/Express Backend
│   ├── models/              # Mongoose Models
│   ├── routes/              # API Routes
│   ├── services/            # Business Logic (Email Service)
│   ├── uploads/             # Temp storage for attachments
│   ├── Dockerfile           # Backend Docker config
│   └── server.js            # Entry point
│
├── frontend/                # React Frontend (Vite)
│   ├── src/
│   │   ├── components/      # React Components
│   │   └── App.jsx          # Main App Component
│   ├── Dockerfile           # Frontend Docker config
│   └── nginx.conf           # Nginx config for Docker
│
├── docker-compose.yml       # Docker orchestration
└── README.md                # Documentation
```
