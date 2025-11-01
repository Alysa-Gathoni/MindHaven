# MindHaven - Getting Started Guide

This guide will help you set up and run the complete MindHaven platform locally.

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** (LTS recommended)
- **Flutter 3.x** (for mobile app)
- **Docker & Docker Compose** (for easy setup)
- **Firebase project** (for authentication)
- **MongoDB** (or use Docker)

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd MindHaven

# Copy environment files
cp backend/env.example backend/.env
cp admin/.env.example admin/.env
```

### 2. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication (Email/Password + Google)
3. Get your Firebase configuration
4. Update the following files:
   - `backend/.env` - Add Firebase Admin SDK credentials
   - `mobile/lib/core/config/firebase_options.dart` - Add Firebase config
   - `admin/.env` - Add Firebase config

### 3. Environment Configuration

#### Backend (.env)

```env
MONGO_URI=mongodb://admin:password@localhost:27017/mindhaven?authSource=admin
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
NODE_ENV=development
PORT=4000
JWT_SECRET=your-jwt-secret-key
```

#### Admin (.env)

```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 4. Start with Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# Check services are running
docker-compose ps

# View logs
docker-compose logs -f
```

This will start:

- MongoDB on port 27017
- Backend API on port 4000
- Admin panel on port 3000

### 5. Seed Sample Data

```bash
# Seed the database with sample data
cd backend
npm install
npm run seed
```

### 6. Access the Applications

- **Backend API**: http://localhost:4000
- **Admin Panel**: http://localhost:3000
- **API Health**: http://localhost:4000/health

## 📱 Mobile App Setup

### Prerequisites

- Flutter 3.x installed
- Android Studio / Xcode for device testing

### Setup

```bash
cd mobile

# Install dependencies
flutter pub get

# Generate code (if needed)
flutter packages pub run build_runner build

# Run on device/emulator
flutter run
```

### Firebase Configuration for Mobile

1. Download configuration files:

   - `android/app/google-services.json` (Android)
   - `ios/Runner/GoogleService-Info.plist` (iOS)

2. Update `lib/core/config/firebase_options.dart` with your project details

## 🔧 Manual Setup (Without Docker)

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Start MongoDB (if not using Docker)
# Install MongoDB locally or use MongoDB Atlas

# Start the server
npm run dev
```

### Admin Panel Setup

```bash
cd admin

# Install dependencies
npm install

# Start development server
npm run dev
```

### Mobile App Setup

```bash
cd mobile

# Install dependencies
flutter pub get

# Run the app
flutter run
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
npm run test:coverage
```

### Admin Panel Tests

```bash
cd admin
npm test
npm run test:coverage
```

### Mobile App Tests

```bash
cd mobile
flutter test
flutter test integration_test/
```

## 📊 Sample Data

The seed script creates:

- 1 admin user
- 5 regular users
- 30 mood entries per user
- 10 journal entries per user
- 1 flagged journal entry for admin review

### Admin Credentials

- Email: admin@mindhaven.com
- Password: (use Firebase Auth to sign in)

## 🔐 Security Setup

### Firebase Admin SDK

1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate a new private key
3. Download the JSON file
4. Extract the values for your `.env` file

### MongoDB Security

For production:

1. Use MongoDB Atlas (recommended)
2. Enable authentication
3. Configure network access
4. Use connection string with credentials

## 🚀 Production Deployment

### Backend Deployment Options

1. **Heroku**

   ```bash
   # Install Heroku CLI
   heroku create mindhaven-api
   heroku addons:create mongolab:sandbox
   git push heroku main
   ```

2. **DigitalOcean App Platform**

   - Connect GitHub repository
   - Configure environment variables
   - Deploy automatically

3. **AWS Elastic Beanstalk**
   - Upload application
   - Configure environment
   - Deploy

### Admin Panel Deployment

1. **Vercel** (Recommended)

   ```bash
   npm install -g vercel
   vercel --prod
   ```

2. **Netlify**
   - Connect GitHub repository
   - Configure build settings
   - Deploy

### Mobile App Deployment

1. **Google Play Store**

   ```bash
   flutter build appbundle --release
   # Upload to Play Console
   ```

2. **Apple App Store**
   ```bash
   flutter build ios --release
   # Archive in Xcode and upload to App Store Connect
   ```

## 🔍 Troubleshooting

### Common Issues

1. **Firebase Authentication Issues**

   - Check Firebase project configuration
   - Verify API keys and domains
   - Ensure authentication methods are enabled

2. **Database Connection Issues**

   - Check MongoDB connection string
   - Verify network access
   - Check authentication credentials

3. **Build Issues**

   - Clear caches: `npm cache clean --force`
   - Delete node_modules and reinstall
   - Check Node.js version compatibility

4. **Mobile App Issues**
   - Run `flutter clean`
   - Run `flutter pub get`
   - Check Flutter version compatibility

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
DEBUG=true
```

## 📚 Next Steps

1. **Customize the UI**: Update themes and branding
2. **Add Features**: Implement additional wellbeing features
3. **Configure Analytics**: Set up monitoring and analytics
4. **Security Review**: Conduct security audit
5. **Performance Optimization**: Optimize for production

## 🆘 Support

- Check the individual README files in each directory
- Review the API documentation
- Check GitHub Issues for common problems
- Contact the development team

## 📄 License

MIT License - see LICENSE file for details.



