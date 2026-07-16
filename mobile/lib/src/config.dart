import 'dart:io' show Platform;

class AppConfig {
  static const configuredBaseUrl = String.fromEnvironment('API_BASE_URL');

  static String get apiBaseUrl {
    if (configuredBaseUrl.isNotEmpty) return configuredBaseUrl;
    if (Platform.isAndroid) return 'http://10.0.2.2:5024/api';
    return 'http://localhost:5024/api';
  }
}
