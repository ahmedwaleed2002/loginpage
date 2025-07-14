# 🚀 SpeedForce Authentication System

A comprehensive, production-ready full-stack authentication system with Firebase integration, GitHub OAuth, and Markdown Notes API featuring the SpeedForce Digital color palette.

## 🎨 Color Palette
- **Primary Deep Blue**: `#11153f`
- **Dark Purple**: `#2b1b58`
- **Bright Red**: `#ed1e2b`
- **Accent Red**: `#ee2139`

## 🔥 Features

### ✅ **Authentication System**
- ✅ **User Registration & Login** with email/password
- ✅ **Email Verification** using SendGrid
- ✅ **Password Reset** functionality
- ✅ **JWT Token Authentication** with refresh tokens
- ✅ **Remember Me** functionality
- ✅ **Account Lockout** after failed attempts
- ✅ **Rate Limiting** for security

### ✅ **GitHub OAuth Integration**
- ✅ **GitHub OAuth 2.0** login
- ✅ **Profile Integration** with GitHub data
- ✅ **Automatic Email Verification** for OAuth users

### ✅ **Markdown Notes API**
- ✅ **Full CRUD Operations** for notes
- ✅ **Markdown to HTML Rendering** using marked.js
- ✅ **Content Sanitization** with DOMPurify
- ✅ **Note Tagging** system
- ✅ **Public/Private** note visibility
- ✅ **Search Functionality**
- ✅ **Pagination** support

### ✅ **Activity Logging**
- ✅ **User Activity Tracking** (login, logout, note operations)
- ✅ **Activity Statistics** and analytics
- ✅ **IP Address & User Agent** logging
- ✅ **Detailed Activity Logs** with timestamps

### ✅ **Security Features**
- ✅ **Password Hashing** with bcrypt
- ✅ **JWT Token Management** with expiration
- ✅ **Rate Limiting** on all endpoints
- ✅ **Input Validation** and sanitization
- ✅ **CORS Protection**
- ✅ **Helmet Security Headers**
- ✅ **Session Management**
- ✅ **CSRF Protection**

### ✅ **Frontend Features**
- ✅ **React + TypeScript** application
- ✅ **SpeedForce Color Palette** integration
- ✅ **TailwindCSS** styling with custom themes
- ✅ **Glass morphism** effects
- ✅ **Responsive design** for all devices
- ✅ **Form validation** with react-hook-form + yup
- ✅ **Toast notifications** for user feedback
- ✅ **Protected routes** with authentication guards
- ✅ **Dashboard** with notes management
- ✅ **Beautiful login/register** forms

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js**
- **Firebase Firestore** (Database)
- **JWT** (Authentication)
- **Passport.js** (GitHub OAuth)
- **SendGrid** (Email Service)
- **bcrypt** (Password Hashing)
- **marked.js** + **DOMPurify** (Markdown Processing)

### Frontend
- **React** + **TypeScript**
- **TailwindCSS** (Styling)
- **React Router** (Navigation)
- **React Hook Form** + **Yup** (Forms & Validation)
- **Axios** (HTTP Client)
- **React Toastify** (Notifications)

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Firebase account
- SendGrid account
- GitHub OAuth App

### 1. Clone Repository
\`\`\`bash
git clone https://github.com/ahmedwaleed2002/loginpage.git
cd loginpage
\`\`\`

### 2. Setup Backend
\`\`\`bash
cd backend
npm install
\`\`\`

**Configure Environment Variables (.env):**
\`\`\`env
# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=speedforce-jwt-secret-2024-production-key-xyz789
JWT_REFRESH_SECRET=speedforce-refresh-jwt-secret-2024-production-key-abc123
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Firebase Configuration
FIREBASE_API_KEY=AIzaSyD1K2x1ieafQin0k5NnWtl0NjFpJkiwvV0
FIREBASE_AUTH_DOMAIN=loginpagetask-de75d.firebaseapp.com
FIREBASE_PROJECT_ID=loginpagetask-de75d
FIREBASE_STORAGE_BUCKET=loginpagetask-de75d.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=775926655501
FIREBASE_APP_ID=1:775926655501:web:2bcc3ee8ff215c30b94344
FIREBASE_MEASUREMENT_ID=G-HF61W3J37L

# SendGrid Configuration
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=your-verified-email@domain.com

# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback

# Security Configuration
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_ATTEMPTS=5
SESSION_SECRET=speedforce-session-secret-2024-production-key-def456

# CORS Configuration
FRONTEND_URL=http://localhost:3000
\`\`\`

**Start Backend:**
\`\`\`bash
npm run dev
\`\`\`

### 3. Setup Frontend
\`\`\`bash
cd ../frontend
npm install
\`\`\`

**Configure Environment Variables (.env):**
\`\`\`env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GITHUB_OAUTH_URL=http://localhost:5000/api/auth/github
\`\`\`

**Start Frontend:**
\`\`\`bash
npm start
\`\`\`

### 4. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **GitHub OAuth**: http://localhost:5000/api/auth/github

## 📱 Screenshots

### Login Page
Beautiful glass morphism login form with SpeedForce branding:
- Email/password authentication
- GitHub OAuth integration
- Remember me functionality
- Forgot password link

### Register Page
Elegant registration form with comprehensive validation:
- Real-time form validation
- Password complexity requirements
- SpeedForce color scheme

### Dashboard
Modern dashboard with notes management:
- User statistics cards
- Notes CRUD operations
- Activity tracking
- Responsive grid layout

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/github` - GitHub OAuth
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/request-password-reset` - Request reset
- `POST /api/auth/reset-password` - Reset password

### Notes
- `POST /api/notes` - Create note
- `GET /api/notes` - Get user notes
- `GET /api/notes/:id` - Get specific note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note
- `GET /api/notes/:id/render` - Render markdown to HTML

### Activity
- `GET /api/activity` - Get activity logs
- `GET /api/activity/stats` - Get activity statistics

## 🔧 Configuration

### GitHub OAuth Setup
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create new OAuth App with:
   - **Application name**: SpeedForce Login System
   - **Homepage URL**: http://localhost:3000
   - **Authorization callback URL**: http://localhost:5000/api/auth/github/callback

### Firebase Setup
1. Create Firebase project
2. Enable Firestore Database
3. Copy configuration to backend .env

### SendGrid Setup
1. Create SendGrid account
2. Verify sender email
3. Create API key with Mail Send permissions

## 🚦 Project Status

### ✅ **Completed Features**
- [x] Complete backend authentication system
- [x] Firebase integration
- [x] GitHub OAuth
- [x] SendGrid email service
- [x] Notes API with markdown support
- [x] Activity logging
- [x] React frontend with TypeScript
- [x] SpeedForce color palette
- [x] Responsive design
- [x] Form validation
- [x] Protected routes
- [x] Dashboard with notes management

### 🔄 **Ready for Enhancement**
- [ ] Email verification flow (backend ready)
- [ ] Advanced markdown editor
- [ ] Note sharing functionality
- [ ] User profile management page
- [ ] Activity logs visualization
- [ ] Dark/light theme toggle
- [ ] Mobile app (React Native)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit changes (\`git commit -m 'Add amazing feature'\`)
4. Push to branch (\`git push origin feature/amazing-feature\`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Developer

**Ahmed Waleed**
- GitHub: [@ahmedwaleed2002](https://github.com/ahmedwaleed2002)
- Project: [SpeedForce Login System](https://github.com/ahmedwaleed2002/loginpage)

---

### 🎉 **Features Highlight**

This authentication system combines:
- **🔐 Enterprise-grade security**
- **🎨 Beautiful SpeedForce design**
- **⚡ Lightning-fast performance**
- **📱 Mobile-first responsive design**
- **🚀 Production-ready architecture**

Perfect for any application requiring robust authentication with a professional, modern interface!
