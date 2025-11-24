# Quick Mail - MERN SMTP Email Application

A modern, full-stack email delivery application built with the MERN stack (MongoDB, Express, React, Node.js). Send emails with rich text formatting, track delivery history, and analyze email performance—all through a premium, responsive UI.

![Quick Mail](https://img.shields.io/badge/Quick%20Mail-v1.0-blue) ![MERN Stack](https://img.shields.io/badge/Stack-MERN-green) ![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📋 Table of Contents
- [Use Cases](#-use-cases)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation \u0026 Setup](#-installation--setup)
- [Environment Configuration](#-environment-configuration)
- [Running the Application](#-running-the-application)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Contributing](#-contributing)

---

## 🎯 Use Cases

**Quick Mail** is perfect for:

- **Transactional Emails**: Send order confirmations, password resets, and notifications
- **Marketing Campaigns**: Deliver newsletters and promotional content with rich formatting
- **Customer Communication**: Professional email delivery with attachment support
- **Email Testing**: Test email templates and delivery with comprehensive tracking
- **Personal Projects**: Self-hosted email solution with full control
- **Learning MERN**: Explore a production-ready MERN application with modern UI/UX

---

## ✨ Features

### 📧 Email Composition
- **Rich Text Editor**: Format emails with bold, italic, underline, lists, and alignment
- **HTML Support**: Advanced HTML email composition with live preview
- **File Attachments**: Upload and send multiple files (up to 10MB per file)
- **Auto-save Draft**: Preserve your work with automatic content syncing

### 📊 Email Management
- **Email History**: Track all sent, failed, and pending emails
- **Advanced Filtering**: Search by recipient, status, and date range
- **Detailed View**: See full email content, attachments, and delivery status
- **Pagination**: Navigate through large email lists efficiently

### 📈 Analytics Dashboard
- **Delivery Stats**: View success/failure rates and total emails processed
- **Performance Charts**: Visualize email delivery over time (last 30 days)
- **Real-time Updates**: Live statistics and status tracking
- **Export Ready**: Data organized for easy export and reporting

### 🎨 Modern UI/UX
- **Dark Mode**: Eye-friendly dark theme set as default
- **Glassmorphism Design**: Premium glass-effect cards and components
- **Fully Responsive**: Optimized for mobile, tablet, and desktop
- **Smooth Animations**: Polished transitions and micro-interactions
- **Accessibility**: Keyboard navigation and screen reader support

### 🔒 Security \u0026 Reliability
- **Email Validation**: Deep validation with MX, typo, and disposable checks
- **Rate Limiting**: Prevent abuse with configurable request limits
- **Secure Authentication**: Gmail OAuth2-ready SMTP integration
- **Error Handling**: Comprehensive error tracking and user-friendly messages
- **Data Persistence**: MongoDB with automatic retry logic

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19.2 with Vite
- **Styling**: Vanilla CSS with CSS Variables for theming
- **Icons**: Lucide React
- **Notifications**: React Toastify
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB (Atlas or Local)
- **Email**: Nodemailer with Gmail SMTP
- **Validation**: Deep Email Validator
- **Security**: Helmet, CORS, Express Rate Limit
- **File Upload**: Multer

### DevOps
- **Containerization**: Docker \u0026 Docker Compose
- **Web Server**: Nginx (for production frontend)
- **Development**: Nodemon, Vite HMR

---

## 📦 Prerequisites

Before running the application, ensure you have:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (Local or Atlas account) - [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Gmail Account** with App Password enabled
- **Docker \u0026 Docker Compose** (Optional, for containerized deployment)

### Gmail App Password Setup
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification**
3. Navigate to **App Passwords**: [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
4. Generate a new app password for "Mail"
5. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

---

## 🚀 Installation \u0026 Setup

### Option 1: Clone the Repository
```bash
git clone https://github.com/janak0ff/MERN-gmail-smpt.git
cd MERN-gmail-smpt
```

---

## ⚙️ Environment Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

**Path**: `backend/.env`

```env
# ======================
# Server Configuration
# ======================
PORT=5000
NODE_ENV=development

# Client URL (Frontend)
CLIENT_URL=http://localhost:3000

# ======================
# Database Configuration
# ======================
# Option 1: MongoDB Atlas (Recommended)
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/quickmail?retryWrites=true&w=majority

# Option 2: Local MongoDB
# MONGODB_URI=mongodb://localhost:27017/quickmail

# ======================
# Email Configuration (Gmail SMTP)
# ======================
# Your Gmail address
GMAIL_USER=your-email@gmail.com

# 16-character App Password (NOT your regular Gmail password)
# Generate at: https://myaccount.google.com/apppasswords
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
```

### MongoDB Atlas Configuration Steps

1. **Create a Free Cluster**:
   - Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a new project
   - Build a free M0 cluster

2. **Get Connection String**:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `quickmail` or your preferred name

3. **Network Access**:
   - Add `0.0.0.0/0` to IP Access List (for development)
   - For production, use specific IPs

4. **Database User**:
   - Create a database user with read/write permissions
   - Use these credentials in your connection string

**Example Connection String**:
```
mongodb+srv://myuser:MySecurePassword123@cluster0.ab1cd.mongodb.net/quickmail?retryWrites=true&w=majority
```

---

## 🏃 Running the Application

### Docker Method (Recommended)

**Easiest way to run both frontend and backend:**

```bash
# Build and start all services
docker-compose up --build

# Run in detached mode (background)
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

**Access the application**:
- 🌐 **Frontend**: [http://localhost:3000](http://localhost:3000)
- 🔌 **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)

---

### Native Method (Without Docker)

**Step 1: Start the Backend**

```bash
cd backend
npm install
npm run dev
```

Backend will run on: `http://localhost:5000`

**Step 2: Start the Frontend** (in a new terminal)

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on: `http://localhost:5173` (or port shown in terminal)

---

## 📁 Project Structure

```
MERN-gmail-smpt/
│
├── backend/                    # Node.js/Express Backend
│   ├── models/
│   │   └── Email.js           # Email schema
│   ├── routes/
│   │   └── email.js           # Email API routes
│   ├── services/
│   │   └── emailService.js    # Email sending logic
│   ├── uploads/               # Temporary file storage
│   ├── .env                   # Environment variables (create this)
│   ├── Dockerfile             # Backend container config
│   ├── package.json           # Backend dependencies
│   └── server.js              # Entry point
│
├── frontend/                  # React/Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ComposeEmail.jsx       # Email composition
│   │   │   ├── EmailHistory.jsx       # History view
│   │   │   ├── EmailStats.jsx         # Analytics
│   │   │   ├── SimpleEditor.jsx       # Rich text editor
│   │   │   ├── Navbar.jsx             # Navigation
│   │   │   ├── LandingPage.jsx        # Home page
│   │   │   └── AboutUs.jsx            # About page
│   │   ├── context/
│   │   │   └── ThemeContext.jsx       # Dark/Light mode
│   │   ├── App.jsx                    # Main component
│   │   ├── App.css                    # Global styles
│   │   └── index.jsx                  # React entry
│   ├── public/                # Static assets
│   ├── Dockerfile             # Frontend container config
│   ├── nginx.conf             # Nginx configuration
│   ├── package.json           # Frontend dependencies
│   └── index.html             # HTML template
│
├── docker-compose.yml         # Docker orchestration
└── README.md                  # This file
```

---

## 🔌 API Reference

### Email Endpoints

#### **POST** `/api/email/send`
Send an email with optional attachments and HTML content.

**Request Body** (multipart/form-data):
```json
{
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "message": "Plain text message",
  "html": "<p>Optional HTML content</p>",
  "attachments": [file1, file2]
}
```

**Response**:
```json
{
  "success": true,
  "messageId": "<unique-id@gmail.com>",
  "emailId": "mongodb-document-id"
}
```

#### **GET** `/api/email/history`
Retrieve email history with filtering and pagination.

**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 10)
- `status` (sent | failed | pending)
- `recipient` (email address search)
- `startDate` (ISO date string)
- `endDate` (ISO date string)

#### **GET** `/api/email/stats/summary`
Get email statistics and analytics.

**Response**:
```json
{
  "total": 150,
  "today": 5,
  "last7Days": 42,
  "last30Days": 120,
  "byStatus": {
    "sent": 140,
    "failed": 8,
    "pending": 2
  }
}
```

#### **GET** `/api/email/:id`
Get details of a specific email by ID.

---

## 🎨 UI Features

### Responsive Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 950px
- **Desktop**: > 950px

### Theme System
- **Default**: Dark Mode
- **Toggle**: Light/Dark mode switcher in navbar
- **Persistence**: Theme saved in localStorage
- **No Flash**: Blocking script prevents white flash on reload

### Key Components
- **Rich Text Editor**: 5 button groups with active state indicators
- **Glassmorphism Cards**: Backdrop blur with transparency
- **Smooth Animations**: Custom cubic-bezier transitions
- **Mobile-First**: Optimized for touch interfaces

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Janak Shrestha**

- GitHub: [@janak0ff](https://github.com/janak0ff)
- LinkedIn: [janakkss](https://www.linkedin.com/in/janakkss/)
- Website: [janakkumarshrestha0.com.np](https://www.janakkumarshrestha0.com.np)

---

## 🙏 Acknowledgments

- Built with the MERN stack
- UI inspiration from modern glassmorphism design
- Email delivery powered by Nodemailer
- Icons by Lucide React

---

## 📞 Support

If you encounter any issues or have questions:
- Open an issue on [GitHub](https://github.com/janak0ff/MERN-gmail-smpt/issues)
- Check existing documentation
- Review the `.env.example` files

---

**Made with ❤️ by Janak Shrestha**
