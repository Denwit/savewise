class UserSession {
  const UserSession({
    required this.token,
    required this.username,
    required this.email,
  });

  final String token;
  final String username;
  final String email;

  factory UserSession.fromJson(Map<String, dynamic> json) {
    final user = json['user'];
    final userMap = user is Map<String, dynamic> ? user : <String, dynamic>{};
    return UserSession(
      token: (json['token'] ?? '').toString(),
      username: (userMap['username'] ?? 'SaveWise user').toString(),
      email: (userMap['email'] ?? '').toString(),
    );
  }
}
