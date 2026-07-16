import 'package:flutter/material.dart';

import 'api/api_client.dart';
import 'screens/auth_screen.dart';
import 'screens/home_screen.dart';

class SaveWiseApp extends StatefulWidget {
  const SaveWiseApp({super.key});

  @override
  State<SaveWiseApp> createState() => _SaveWiseAppState();
}

class _SaveWiseAppState extends State<SaveWiseApp> {
  final ApiClient _apiClient = ApiClient();
  ThemeMode _themeMode = ThemeMode.light;
  String? _username;
  String? _email;

  bool get _isDarkMode => _themeMode == ThemeMode.dark;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SaveWise',
      debugShowCheckedModeBanner: false,
      themeMode: _themeMode,
      theme: _buildTheme(Brightness.light),
      darkTheme: _buildTheme(Brightness.dark),
      home: _apiClient.isSignedIn
          ? HomeScreen(
              apiClient: _apiClient,
              username: _username ?? 'SaveWise user',
              email: _email ?? '',
              isDarkMode: _isDarkMode,
              onThemeChanged: _setDarkMode,
              onSignOut: _signOut,
            )
          : AuthScreen(
              apiClient: _apiClient,
              onAuthenticated: (session) {
                setState(() {
                  _username = session.username;
                  _email = session.email;
                });
              },
            ),
    );
  }

  ThemeData _buildTheme(Brightness brightness) {
    const brandBlue = Color(0xFF497FFF);
    final isDark = brightness == Brightness.dark;
    final scheme = ColorScheme.fromSeed(
      seedColor: brandBlue,
      brightness: brightness,
    );

    final theme = ThemeData(
      colorScheme: scheme,
      brightness: brightness,
      useMaterial3: true,
      fontFamily: 'Nunito',
      scaffoldBackgroundColor:
          isDark ? const Color(0xFF0B1020) : const Color(0xFFF8FAFF),
    );

    return theme.copyWith(
      appBarTheme: AppBarTheme(
        centerTitle: false,
        elevation: 0,
        backgroundColor: isDark ? scheme.surface : brandBlue,
        foregroundColor: isDark ? scheme.onSurface : Colors.white,
        titleTextStyle: theme.textTheme.titleLarge?.copyWith(
          color: isDark ? scheme.onSurface : Colors.white,
          fontWeight: FontWeight.w800,
        ),
      ),
      dividerTheme: const DividerThemeData(space: 0),
      inputDecorationTheme: const InputDecorationTheme(
        border: OutlineInputBorder(),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        margin: EdgeInsets.zero,
        color: scheme.surface,
        surfaceTintColor: scheme.surfaceTint,
        shape: RoundedRectangleBorder(
          borderRadius: const BorderRadius.all(Radius.circular(8)),
          side: BorderSide(color: scheme.outlineVariant),
        ),
      ),
      listTileTheme: theme.listTileTheme.copyWith(
        minVerticalPadding: 8,
        subtitleTextStyle: theme.textTheme.bodySmall,
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: scheme.primary,
        foregroundColor: scheme.onPrimary,
      ),
      bottomSheetTheme: theme.bottomSheetTheme.copyWith(
        elevation: 0,
        showDragHandle: true,
        clipBehavior: Clip.hardEdge,
        surfaceTintColor: scheme.surface,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(8)),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        indicatorColor: scheme.primaryContainer,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
      ),
    );
  }

  void _setDarkMode(bool enabled) {
    setState(() => _themeMode = enabled ? ThemeMode.dark : ThemeMode.light);
  }

  void _signOut() {
    setState(() {
      _apiClient.setToken(null);
      _username = null;
      _email = null;
    });
  }
}
