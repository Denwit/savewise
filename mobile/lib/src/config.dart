class AppConfig {
  static const configuredBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://savewise-mpzn.onrender.com/api',
  );

  static String get apiBaseUrl => configuredBaseUrl;
}
