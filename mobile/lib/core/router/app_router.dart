import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mindhaven/features/auth/providers/auth_provider.dart';
import 'package:mindhaven/features/auth/pages/login_page.dart';
import 'package:mindhaven/features/auth/pages/register_page.dart';
import 'package:mindhaven/features/onboarding/pages/onboarding_page.dart';
import 'package:mindhaven/features/home/pages/home_page.dart';
import 'package:mindhaven/features/mood/pages/mood_entry_page.dart';
import 'package:mindhaven/features/mood/pages/mood_history_page.dart';
import 'package:mindhaven/features/journal/pages/journal_list_page.dart';
import 'package:mindhaven/features/journal/pages/journal_entry_page.dart';
import 'package:mindhaven/features/analytics/pages/analytics_page.dart';
import 'package:mindhaven/features/settings/pages/settings_page.dart';
import 'package:mindhaven/features/settings/pages/privacy_page.dart';
import 'package:mindhaven/features/settings/pages/export_data_page.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/onboarding',
    redirect: (context, state) {
      final isLoggedIn = authState.when(
        data: (user) => user != null,
        loading: () => false,
        error: (_, __) => false,
      );

      final isOnAuthPage =
          state.location.startsWith('/login') ||
          state.location.startsWith('/register');
      final isOnOnboarding = state.location == '/onboarding';

      // If not logged in and not on auth/onboarding pages, redirect to login
      if (!isLoggedIn && !isOnAuthPage && !isOnOnboarding) {
        return '/login';
      }

      // If logged in and on auth pages, redirect to home
      if (isLoggedIn && isOnAuthPage) {
        return '/home';
      }

      return null;
    },
    routes: [
      // Onboarding
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingPage(),
      ),

      // Authentication
      GoRoute(path: '/login', builder: (context, state) => const LoginPage()),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterPage(),
      ),

      // Main App
      ShellRoute(
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          GoRoute(path: '/home', builder: (context, state) => const HomePage()),
          GoRoute(
            path: '/mood/entry',
            builder: (context, state) => const MoodEntryPage(),
          ),
          GoRoute(
            path: '/mood/history',
            builder: (context, state) => const MoodHistoryPage(),
          ),
          GoRoute(
            path: '/journal',
            builder: (context, state) => const JournalListPage(),
          ),
          GoRoute(
            path: '/journal/entry',
            builder: (context, state) => const JournalEntryPage(),
          ),
          GoRoute(
            path: '/journal/entry/:id',
            builder: (context, state) {
              final id = state.pathParameters['id']!;
              return JournalEntryPage(journalId: id);
            },
          ),
          GoRoute(
            path: '/analytics',
            builder: (context, state) => const AnalyticsPage(),
          ),
          GoRoute(
            path: '/settings',
            builder: (context, state) => const SettingsPage(),
          ),
        ],
      ),

      // Settings sub-pages
      GoRoute(
        path: '/settings/privacy',
        builder: (context, state) => const PrivacyPage(),
      ),
      GoRoute(
        path: '/settings/export',
        builder: (context, state) => const ExportDataPage(),
      ),
    ],
  );
});

class MainShell extends ConsumerWidget {
  final Widget child;

  const MainShell({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _getCurrentIndex(context),
        onTap: (index) => _onTap(context, index),
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.mood_outlined),
            activeIcon: Icon(Icons.mood),
            label: 'Mood',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.book_outlined),
            activeIcon: Icon(Icons.book),
            label: 'Journal',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.analytics_outlined),
            activeIcon: Icon(Icons.analytics),
            label: 'Analytics',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings_outlined),
            activeIcon: Icon(Icons.settings),
            label: 'Settings',
          ),
        ],
      ),
    );
  }

  int _getCurrentIndex(BuildContext context) {
    final location = GoRouterState.of(context).location;
    if (location.startsWith('/home')) return 0;
    if (location.startsWith('/mood')) return 1;
    if (location.startsWith('/journal')) return 2;
    if (location.startsWith('/analytics')) return 3;
    if (location.startsWith('/settings')) return 4;
    return 0;
  }

  void _onTap(BuildContext context, int index) {
    switch (index) {
      case 0:
        context.go('/home');
        break;
      case 1:
        context.go('/mood/history');
        break;
      case 2:
        context.go('/journal');
        break;
      case 3:
        context.go('/analytics');
        break;
      case 4:
        context.go('/settings');
        break;
    }
  }
}



