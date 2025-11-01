import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:mindhaven/core/config/app_config.dart';
import 'package:mindhaven/core/config/firebase_options.dart';
import 'package:mindhaven/core/theme/app_theme.dart';
import 'package:mindhaven/core/router/app_router.dart';
import 'package:mindhaven/core/services/notification_service.dart';
import 'package:mindhaven/core/services/storage_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  // Initialize Hive for local storage
  await Hive.initFlutter();

  // Initialize services
  await StorageService.initialize();
  await NotificationService.initialize();

  runApp(const ProviderScope(child: MindHavenApp()));
}

class MindHavenApp extends ConsumerWidget {
  const MindHavenApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'MindHaven',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      routerConfig: router,
      builder: (context, child) {
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(
            textScaler: const TextScaler.linear(1.0), // Prevent font scaling
          ),
          child: child!,
        );
      },
    );
  }
}



