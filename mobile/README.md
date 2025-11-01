# MindHaven Mobile App

Flutter mobile application for student wellbeing with mood tracking and journaling.

## Features

- 🔐 Firebase Authentication (email/password + Google)
- 😊 Daily mood tracking with emoji and tags
- 📝 Rich text journaling with markdown support
- 📊 Personal analytics and insights
- 📤 Data export and account deletion (GDPR)
- 🚨 Crisis detection with local resources
- 🔄 Offline support with sync
- 🎨 Beautiful, accessible UI

## Tech Stack

- **Framework**: Flutter 3.x
- **Language**: Dart
- **State Management**: Riverpod
- **Authentication**: Firebase Auth
- **Local Storage**: Hive
- **HTTP Client**: Dio
- **Charts**: FL Chart
- **UI**: Material Design 3

## Quick Start

### Prerequisites

- Flutter 3.x
- Dart SDK
- Android Studio / Xcode
- Firebase project setup

### Installation

```bash
# Install dependencies
flutter pub get

# Generate code (if needed)
flutter packages pub run build_runner build

# Run the app
flutter run
```

### Firebase Setup

1. Create a Firebase project
2. Enable Authentication (Email/Password + Google)
3. Download configuration files:
   - `android/app/google-services.json` (Android)
   - `ios/Runner/GoogleService-Info.plist` (iOS)
4. Update `lib/core/config/firebase_options.dart` with your project details

### Environment Configuration

Create a `.env` file in the project root:

```env
API_BASE_URL=http://localhost:4000/api
FIREBASE_PROJECT_ID=your-firebase-project-id
```

## Project Structure

```
lib/
├── core/                 # Core functionality
│   ├── config/          # App configuration
│   ├── router/          # Navigation
│   ├── services/        # Business logic
│   └── theme/           # UI theming
├── features/            # Feature modules
│   ├── auth/            # Authentication
│   ├── mood/            # Mood tracking
│   ├── journal/         # Journaling
│   ├── analytics/       # Analytics
│   └── settings/        # Settings
├── shared/              # Shared components
│   ├── widgets/         # Reusable widgets
│   ├── models/          # Data models
│   └── utils/           # Utilities
└── main.dart           # App entry point
```

## Key Features

### Mood Tracking

- 1-10 scale with emoji support
- Custom tags and notes
- Daily mood history
- Mood trends and analytics

### Journaling

- Rich text editor with markdown
- Mood-linked entries
- Private by default
- Search and filter
- Export functionality

### Analytics

- Mood trends over time
- Sentiment analysis
- Weekly/monthly summaries
- Personal insights

### Crisis Support

- Automatic crisis language detection
- Local emergency resources
- Crisis contact information
- Safety planning tools

## State Management

The app uses Riverpod for state management with the following providers:

- `authStateProvider` - Authentication state
- `moodProvider` - Mood tracking
- `journalProvider` - Journal management
- `analyticsProvider` - Analytics data
- `settingsProvider` - App settings

## Local Storage

Uses Hive for local data persistence:

- User preferences
- Cached mood entries
- Offline journal drafts
- App settings

## Offline Support

- Mood entries cached locally
- Journal drafts saved offline
- Automatic sync when online
- Conflict resolution

## Security & Privacy

- Firebase token authentication
- Local data encryption (optional)
- GDPR-compliant data export
- Account deletion
- Privacy controls

## Testing

```bash
# Run unit tests
flutter test

# Run integration tests
flutter test integration_test/

# Run tests with coverage
flutter test --coverage
```

## Building for Production

### Android

```bash
# Build APK
flutter build apk --release

# Build App Bundle
flutter build appbundle --release
```

### iOS

```bash
# Build iOS app
flutter build ios --release
```

## Deployment

### Google Play Store

1. Build release APK/AAB
2. Create app listing in Play Console
3. Upload signed bundle
4. Configure app permissions
5. Submit for review

### Apple App Store

1. Build iOS app
2. Archive in Xcode
3. Upload to App Store Connect
4. Configure app metadata
5. Submit for review

## Environment Variables

Create a `.env` file for environment-specific configuration:

```env
# API Configuration
API_BASE_URL=https://your-api-domain.com/api

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_CRASH_REPORTING=true
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_OFFLINE_MODE=true
ENABLE_ENCRYPTION=false
```

## Troubleshooting

### Common Issues

1. **Firebase setup**: Ensure configuration files are in correct locations
2. **Build errors**: Run `flutter clean` and `flutter pub get`
3. **iOS signing**: Configure signing in Xcode
4. **Android permissions**: Check `android/app/src/main/AndroidManifest.xml`

### Debug Mode

```bash
# Enable debug logging
flutter run --debug

# Check device logs
flutter logs
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.



