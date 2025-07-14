# SpeedForce Authentication System Backend

A comprehensive, production-ready authentication system with Firebase integration, GitHub OAuth, and Markdown Notes API.

## Features

### 🔐 Authentication System
- **User Registration & Login** with email/password
- **Email Verification** using SendGrid
- **Password Reset** functionality
- **JWT Token Authentication** with refresh tokens
- **Remember Me** functionality
- **Account Lockout** after failed attempts
- **Rate Limiting** for security

### 🔗 GitHub OAuth Integration
- **GitHub OAuth 2.0** login
- **Profile Integration** with GitHub data
- **Automatic Email Verification** for OAuth users

### 📝 Markdown Notes API
- **Full CRUD Operations** for notes
- **Markdown to HTML Rendering** using marked.js
- **Content Sanitization** with DOMPurify
- **Note Tagging** system
- **Public/Private** note visibility
- **Search Functionality**
- **Pagination** support

### 📊 Activity Logging
- **User Activity Tracking** (login, logout, note operations)
- **Activity Statistics** and analytics
- **IP Address & User Agent** logging
- **Detailed Activity Logs** with timestamps

### 🛡️ Security Features
- **Password Hashing** with bcrypt
- **JWT Token Management** with expiration
- **Rate Limiting** on all endpoints
- **Input Validation** and sanitization
- **CORS Protection**
- **Helmet Security Headers**
- **Session Management**
- **CSRF Protection**

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: Firebase Firestore
- **Authentication**: JWT, Passport.js
- **Email**: SendGrid
- **Markdown**: marked.js, DOMPurify
- **Security**: bcrypt, helmet, express-rate-limit
- **Validation**: express-validator

## API Endpoints

### Authentication Endpoints
```
POST   /api/auth/register              - User registration
POST   /api/auth/login                 - User login
POST   /api/auth/logout                - User logout
POST   /api/auth/verify-email          - Email verification
POST   /api/auth/resend-verification   - Resend verification email
POST   /api/auth/request-password-reset - Request password reset
POST   /api/auth/reset-password        - Reset password
POST   /api/auth/refresh-token         - Refresh JWT token
GET    /api/auth/profile               - Get user profile
PUT    /api/auth/profile               - Update user profile
PUT    /api/auth/change-password       - Change password
GET    /api/auth/health                - Health check
```

### GitHub OAuth Endpoints
```
GET    /api/auth/github                - Initiate GitHub OAuth
GET    /api/auth/github/callback       - GitHub OAuth callback
GET    /api/auth/github/failure        - GitHub OAuth failure
```

### Notes Endpoints
```
POST   /api/notes                      - Create new note
GET    /api/notes                      - Get user notes (with pagination)
GET    /api/notes/:noteId              - Get specific note
PUT    /api/notes/:noteId              - Update note
DELETE /api/notes/:noteId              - Delete note
GET    /api/notes/:noteId/render       - Render note content to HTML
```

### Activity Log Endpoints
```
GET    /api/activity                   - Get user activity logs
GET    /api/activity/stats             - Get activity statistics
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Firebase Configuration
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-firebase-domain
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
FIREBASE_MEASUREMENT_ID=your-measurement-id

# SendGrid Configuration
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback

# Security Configuration
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_ATTEMPTS=5
SESSION_SECRET=your-session-secret

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

### 3. Firebase Setup
1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Firestore Database
3. Get your Firebase config and add to .env

### 4. SendGrid Setup
1. Create a SendGrid account at https://sendgrid.com/
2. Get your API key and add to .env
3. Verify your sender email

### 5. GitHub OAuth Setup
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL to: `http://localhost:5000/api/auth/github/callback`
4. Get Client ID and Client Secret and add to .env

### 6. Run the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Usage Examples

### Register a New User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "rememberMe": true
  }'
```

### Create a Note
```bash
curl -X POST http://localhost:5000/api/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "My First Note",
    "content": "# Hello World\n\nThis is my first **markdown** note!",
    "tags": ["tutorial", "markdown"],
    "isPublic": false
  }'
```

### Get User Notes
```bash
curl -X GET "http://localhost:5000/api/notes?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Render Note to HTML
```bash
curl -X GET http://localhost:5000/api/notes/NOTE_ID/render \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Project Structure

```
backend/
├── config/
│   ├── firebase.js         # Firebase configuration
│   └── passport.js         # Passport.js configuration
├── controllers/
│   ├── authController.js   # Authentication logic
│   ├── noteController.js   # Notes management
│   └── activityController.js # Activity logging
├── middleware/
│   ├── auth.js            # JWT authentication
│   ├── rateLimiter.js     # Rate limiting
│   └── validation.js      # Input validation
├── models/
│   ├── User.js            # User model
│   ├── Note.js            # Note model
│   └── ActivityLog.js     # Activity log model
├── routes/
│   ├── auth.js            # Authentication routes
│   ├── notes.js           # Notes routes
│   └── activity.js        # Activity log routes
├── utils/
│   ├── jwt.js             # JWT utilities
│   └── email.js           # Email utilities
├── .env                   # Environment variables
├── server.js              # Main server file
└── package.json           # Dependencies
```

## Error Handling

The API uses consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "errors": [] // Optional validation errors
}
```

## Security Considerations

- All passwords are hashed with bcrypt (12 rounds)
- JWT tokens expire after 15 minutes (configurable)
- Refresh tokens expire after 7 days
- Rate limiting prevents brute force attacks
- Input validation prevents injection attacks
- CORS configured for frontend origin only
- Security headers enabled with Helmet
- Session management for OAuth flows

## Testing

The backend includes comprehensive error handling and logging for easy debugging. All endpoints return detailed error messages in development mode.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - See LICENSE file for details
