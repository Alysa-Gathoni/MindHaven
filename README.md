# MindHaven - Student Wellbeing App

A comprehensive wellbeing platform for students featuring mood tracking, journaling, and admin analytics.

## Project Structure

```
MindHaven/
├── mobile/          # Flutter mobile app (Android + iOS)
├── backend/         # Node.js + Express REST API
├── admin/           # React.js admin panel
├── docker-compose.yml
└── README.md
```

## Quick Start

1. **Prerequisites**

   - Node.js 18+ (LTS)
   - Flutter 3.x
   - MongoDB 6+
   - Firebase project setup

2. **Environment Setup**

   ```bash
   # Copy environment templates
   cp backend/.env.example backend/.env
   cp admin/.env.example admin/.env
   ```

3. **Local Development**

   ```bash
   # Start all services with Docker
   docker-compose up -d

   # Or run individually:
   # Backend: cd backend && npm install && npm run dev
   # Admin: cd admin && npm install && npm run dev
   # Mobile: cd mobile && flutter pub get && flutter run
   ```

## Features

### Student Features

- 🔐 Secure authentication (Firebase Auth)
- 😊 Daily mood tracking (1-10 scale + tags)
- 📝 Private journaling with rich text
- 📊 Personal analytics and insights
- 📤 Data export and deletion (GDPR compliant)
- 🚨 Crisis detection and local resources

### Admin Features

- 👥 User management and analytics
- 📈 Anonymized aggregate insights
- 🚩 Flagged content review
- ⚙️ System configuration

## Tech Stack

- **Backend**: Node.js, Express, MongoDB, Firebase Admin SDK
- **Mobile**: Flutter, Dart, Firebase Auth
- **Admin**: React, TypeScript, Tailwind CSS
- **Infrastructure**: Docker, GitHub Actions

## Security & Privacy

- Firebase token verification on all protected routes
- Input validation and sanitization
- Rate limiting and security headers
- GDPR-compliant data export/deletion
- Crisis language detection with human review
- No automated counseling - emergency resources only

## Development

Each component has its own README with detailed setup instructions:

- [Backend Setup](backend/README.md)
- [Mobile Setup](mobile/README.md)
- [Admin Setup](admin/README.md)

## License

MIT License - see LICENSE file for details.



