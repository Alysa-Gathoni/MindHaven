# MindHaven Backend API

Node.js + Express REST API for the MindHaven wellbeing platform.

## Features

- 🔐 Firebase Authentication integration
- 📊 Mood tracking and analytics
- 📝 Journaling with sentiment analysis
- 🚩 Crisis detection and flagging
- 👥 User management and admin controls
- 📤 GDPR-compliant data export/deletion
- 🔒 Security middleware and rate limiting

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4+
- **Database**: MongoDB 6+ with Mongoose
- **Authentication**: Firebase Admin SDK
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting
- **Testing**: Jest + Supertest

## Quick Start

### Prerequisites

- Node.js 18+ (LTS)
- MongoDB 6+
- Firebase project with Admin SDK

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp env.example .env

# Configure your .env file with:
# - MongoDB connection string
# - Firebase Admin SDK credentials
# - JWT secret key
```

### Environment Variables

```env
# Database
MONGO_URI=mongodb://admin:password@localhost:27017/mindhaven?authSource=admin

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com

# Server Configuration
NODE_ENV=development
PORT=4000
JWT_SECRET=your-jwt-secret-key

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Database Setup

```bash
# Seed sample data
npm run seed
```

## API Endpoints

### Authentication

- `POST /api/auth/verify` - Verify Firebase token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh session

### Users

- `GET /api/users/me` - Get current user profile
- `PATCH /api/users/me` - Update profile
- `GET /api/users/:id` - Get user by ID (admin/owner)
- `GET /api/users` - List users (admin)
- `PATCH /api/users/:id` - Update user (admin)
- `DELETE /api/users/:id` - Delete user (admin)

### Moods

- `POST /api/moods` - Create mood entry
- `GET /api/moods` - Get user's moods
- `GET /api/moods/stats` - Get mood statistics
- `GET /api/moods/:id` - Get specific mood
- `DELETE /api/moods/:id` - Delete mood

### Journals

- `POST /api/journals` - Create journal entry
- `GET /api/journals` - Get user's journals
- `GET /api/journals/stats` - Get journal statistics
- `GET /api/journals/:id` - Get specific journal
- `PUT /api/journals/:id` - Update journal
- `DELETE /api/journals/:id` - Delete journal

### Admin

- `GET /api/admin/analytics` - Get system analytics
- `GET /api/admin/flagged` - Get flagged entries
- `PATCH /api/admin/flagged/:id` - Review flagged entry
- `GET /api/admin/users/:id/activity` - Get user activity
- `GET /api/admin/system/health` - System health check

### Export

- `POST /api/export/data` - Export user data (JSON/CSV)
- `DELETE /api/export/delete-account` - Delete account
- `GET /api/export/status` - Get export status

## Data Models

### User

```javascript
{
  _id: ObjectId,
  firebaseUid: String,
  email: String,
  displayName: String,
  role: 'user' | 'admin',
  createdAt: Date,
  lastSeen: Date,
  disabled: Boolean
}
```

### Mood

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  score: Number (1-10),
  emoji: String,
  tags: [String],
  note: String,
  date: Date,
  createdAt: Date
}
```

### Journal

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  title: String,
  body: String,
  moodId: ObjectId,
  visibility: 'private' | 'shared',
  sentiment: {
    score: Number,
    comparative: Number,
    analysis: String
  },
  flagged: {
    isFlagged: Boolean,
    reason: String,
    flaggedBy: ObjectId,
    flaggedAt: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Security Features

- Firebase token verification on all protected routes
- Role-based access control (user/admin)
- Input validation with Joi
- Rate limiting (100 requests per 15 minutes)
- Security headers with Helmet
- CORS configuration
- Data sanitization

## Crisis Detection

The system automatically detects crisis language in journal entries and:

- Flags entries for admin review
- Provides local crisis resources to users
- Does NOT provide automated counseling
- Requires human review for all flagged content

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Docker

```bash
# Build image
docker build -t mindhaven-backend .

# Run container
docker run -p 4000:4000 --env-file .env mindhaven-backend
```

## Production Deployment

1. Set up MongoDB Atlas or self-hosted MongoDB
2. Configure Firebase Admin SDK
3. Set environment variables
4. Deploy to your preferred platform:
   - Heroku
   - DigitalOcean App Platform
   - AWS Elastic Beanstalk
   - Google Cloud Run
   - Railway

## License

MIT License - see LICENSE file for details.



