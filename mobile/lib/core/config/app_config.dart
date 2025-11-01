class AppConfig {
  // API Configuration
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:4000/api',
  );

  // Firebase Configuration
  static const String firebaseProjectId = String.fromEnvironment(
    'FIREBASE_PROJECT_ID',
    defaultValue: 'your-firebase-project-id',
  );

  // App Configuration
  static const String appName = 'MindHaven';
  static const String appVersion = '1.0.0';
  static const String appBuildNumber = '1';

  // Feature Flags
  static const bool enableAnalytics = true;
  static const bool enableCrashReporting = true;
  static const bool enablePushNotifications = true;
  static const bool enableOfflineMode = true;
  static const bool enableEncryption = false; // Optional feature

  // Data Retention
  static const int moodRetentionDays = 365;
  static const int journalRetentionDays = 365;
  static const int cacheRetentionDays = 30;

  // UI Configuration
  static const double maxContentWidth = 600.0;
  static const double borderRadius = 12.0;
  static const double spacing = 16.0;

  // Crisis Resources
  static const List<Map<String, String>> crisisResources = [
    {
      'name': 'National Suicide Prevention Lifeline',
      'number': '988',
      'description': '24/7 crisis support',
    },
    {
      'name': 'Crisis Text Line',
      'number': 'Text HOME to 741741',
      'description': '24/7 crisis text support',
    },
    {
      'name': 'Emergency Services',
      'number': '911',
      'description': 'For immediate emergencies',
    },
  ];

  // Mood Scale Configuration
  static const List<Map<String, dynamic>> moodScale = [
    {'score': 1, 'label': 'Very Low', 'color': 0xFFE53E3E, 'emoji': '😢'},
    {'score': 2, 'label': 'Low', 'color': 0xFFDD6B20, 'emoji': '😔'},
    {'score': 3, 'label': 'Below Average', 'color': 0xFFD69E2E, 'emoji': '😕'},
    {'score': 4, 'label': 'Poor', 'color': 0xFFECC94B, 'emoji': '😐'},
    {'score': 5, 'label': 'Neutral', 'color': 0xFFF6E05E, 'emoji': '😐'},
    {'score': 6, 'label': 'Fair', 'color': 0xFF68D391, 'emoji': '🙂'},
    {'score': 7, 'label': 'Good', 'color': 0xFF48BB78, 'emoji': '😊'},
    {'score': 8, 'label': 'Very Good', 'color': 0xFF38A169, 'emoji': '😄'},
    {'score': 9, 'label': 'Excellent', 'color': 0xFF2F855A, 'emoji': '🤩'},
    {'score': 10, 'label': 'Outstanding', 'color': 0xFF276749, 'emoji': '🥳'},
  ];

  // Common Tags
  static const List<String> commonTags = [
    'Work',
    'School',
    'Family',
    'Friends',
    'Health',
    'Exercise',
    'Sleep',
    'Weather',
    'Travel',
    'Hobbies',
    'Stress',
    'Relaxation',
    'Social',
    'Alone',
    'Creative',
    'Learning',
    'Challenging',
    'Rewarding',
    'Frustrating',
    'Exciting',
  ];
}



