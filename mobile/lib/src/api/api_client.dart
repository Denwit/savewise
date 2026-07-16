import 'dart:convert';
import 'dart:io';

import '../config.dart';
import '../models/dashboard_summary.dart';
import '../models/saving_plan.dart';
import '../models/user_session.dart';
import '../utils/date_utils.dart';

class ApiException implements Exception {
  ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class ApiClient {
  ApiClient({HttpClient? httpClient})
      : _httpClient = httpClient ?? HttpClient();

  final HttpClient _httpClient;
  String? _token;

  bool get isSignedIn => _token != null && _token!.isNotEmpty;

  void setToken(String? token) {
    _token = token;
  }

  Future<UserSession> login(String email, String password) async {
    final data = await _request(
      'POST',
      '/auth/login',
      body: {'email': email, 'password': password},
      authenticated: false,
    );

    final session = UserSession.fromJson(data);
    setToken(session.token);
    return session;
  }

  Future<String> forgotPassword(String email) async {
    final data = await _request(
      'POST',
      '/auth/forgot-password',
      body: {'email': email},
      authenticated: false,
    );
    return (data['message'] ??
            'If an account exists with this email, you will receive a password reset link.')
        .toString();
  }

  Future<UserSession> register({
    required String username,
    required String email,
    required String password,
    String? phone,
  }) async {
    final data = await _request(
      'POST',
      '/auth/register',
      body: {
        'username': username,
        'email': email,
        'password': password,
        if (phone != null && phone.isNotEmpty) 'phone': phone,
      },
      authenticated: false,
    );

    final session = UserSession.fromJson(data);
    setToken(session.token);
    return session;
  }

  Future<DashboardSummary> getDashboard() async {
    final data = await _request('GET', '/dashboard/stats');
    return DashboardSummary.fromJson(data);
  }

  Future<List<SavingPlan>> getPlans() async {
    final data = await _request('GET', '/plans');
    return _list(data, 'plans').map(SavingPlan.fromJson).toList();
  }

  Future<SavingPlan> getPlan(int id) async {
    final plan = await getPlanDetails(id);
    return SavingPlan.fromJson(plan);
  }

  Future<Map<String, dynamic>> getPlanDetails(int id) async {
    final data = await _request('GET', '/plans/$id');
    final plan = data['plan'];
    if (plan is Map<String, dynamic>) return plan;
    throw ApiException('The server returned an invalid plan response.');
  }

  Future<SavingPlan> createPlan({
    required String name,
    required String frequency,
    required double targetAmount,
    required double fixedAmount,
    required int maxMembers,
    required DateTime startDate,
    required DateTime endDate,
    String? description,
    bool isFixedAmount = true,
    double interestRate = 0,
  }) async {
    final data = await _request(
      'POST',
      '/plans',
      body: {
        'plan_name': name,
        'description': description ?? '',
        'frequency': frequency,
        'target_amount': targetAmount,
        'fixed_amount': isFixedAmount ? fixedAmount : null,
        'is_fixed_amount': isFixedAmount,
        'interest_rate': interestRate,
        'max_members': maxMembers,
        'start_date': dateOnly(startDate),
        'end_date': dateOnly(endDate),
      },
    );

    final plan = data['plan'];
    if (plan is Map<String, dynamic>) return SavingPlan.fromJson(plan);
    throw ApiException('The server returned an invalid plan response.');
  }

  Future<SavingPlan> updatePlan({
    required int id,
    required String name,
    required String frequency,
    required double targetAmount,
    required double fixedAmount,
    required int maxMembers,
    required DateTime startDate,
    required DateTime endDate,
    String? description,
    bool isFixedAmount = true,
    double interestRate = 0,
  }) async {
    final data = await _request(
      'PUT',
      '/plans/$id',
      body: {
        'plan_name': name,
        'description': description ?? '',
        'frequency': frequency,
        'target_amount': targetAmount,
        'fixed_amount': isFixedAmount ? fixedAmount : null,
        'is_fixed_amount': isFixedAmount,
        'interest_rate': interestRate,
        'max_members': maxMembers,
        'start_date': dateOnly(startDate),
        'end_date': dateOnly(endDate),
      },
    );
    final plan = data['plan'];
    if (plan is Map<String, dynamic>) return SavingPlan.fromJson(plan);
    throw ApiException('The server returned an invalid plan response.');
  }

  Future<void> deletePlan(int id) async {
    await _request('DELETE', '/plans/$id');
  }

  Future<Map<String, dynamic>> updatePlanSettings(
      int id, Map<String, dynamic> settings) async {
    final data = await _request('PUT', '/plans/$id/settings', body: settings);
    return _map(data, 'plan');
  }

  Future<Map<String, dynamic>> sendInvitation({
    required int planId,
    String? email,
    int? userId,
  }) async {
    final data = await _request(
      'POST',
      '/invitations',
      body: {
        'plan_id': planId,
        if (email != null && email.isNotEmpty) 'user_email': email,
        if (userId != null && userId > 0) 'user_id': userId,
      },
    );
    return _map(data, 'invitation');
  }

  Future<List<Map<String, dynamic>>> searchUsersToInvite(String query) async {
    final encoded = Uri.encodeQueryComponent(query.trim());
    final data =
        await _request('GET', '/invitations/search-users?search=$encoded');
    return _list(data, 'users');
  }

  Future<Map<String, dynamic>> inviteExternal({
    required int planId,
    String? email,
    String? phone,
    String? name,
    String? channel,
  }) async {
    final data = await _request(
      'POST',
      '/plans/$planId/invite-external',
      body: {
        if (email != null && email.isNotEmpty) 'email': email,
        if (phone != null && phone.isNotEmpty) 'phone': phone,
        if (name != null && name.isNotEmpty) 'name': name,
        if (channel != null && channel.isNotEmpty) 'channel': channel,
      },
    );
    return data;
  }

  Future<List<Map<String, dynamic>>> getPendingPlanInvitations(
      int planId) async {
    final data = await _request('GET', '/plans/$planId/pending-invitations');
    return _list(data, 'invitations');
  }

  Future<List<Map<String, dynamic>>> getDeposits() async {
    final data = await _request('GET', '/deposits/my-deposits');
    return _list(data, 'deposits');
  }

  Future<Map<String, dynamic>> approveDeposit(int id) async {
    final data = await _request('PUT', '/deposits/$id/approve');
    return _map(data, 'deposit');
  }

  Future<Map<String, dynamic>> rejectDeposit(int id, String reason) async {
    final data = await _request(
      'PUT',
      '/deposits/$id/reject',
      body: {'rejection_reason': reason},
    );
    return _map(data, 'deposit');
  }

  Future<Map<String, dynamic>> createDeposit({
    required int planId,
    required double amount,
    required DateTime depositDate,
    String? notes,
  }) async {
    final data = await _request(
      'POST',
      '/deposits',
      body: {
        'plan_id': planId,
        'amount': amount,
        'deposit_date': dateOnly(depositDate),
        if (notes != null && notes.isNotEmpty) 'notes': notes,
      },
    );
    return _map(data, 'deposit');
  }

  Future<List<Map<String, dynamic>>> getPlanDeposits(int planId) async {
    final data = await _request('GET', '/deposits/plan/$planId');
    return _list(data, 'deposits');
  }

  Future<List<Map<String, dynamic>>> getPlanMessages(int planId) async {
    final data = await _request('GET', '/plans/$planId/messages');
    return _list(data, 'messages');
  }

  Future<Map<String, dynamic>> sendPlanMessage({
    required int planId,
    required String message,
  }) async {
    final data = await _request(
      'POST',
      '/plans/$planId/messages',
      body: {'message': message},
    );
    return _map(data, 'message');
  }

  Future<List<Map<String, dynamic>>> getWithdrawals({int? planId}) async {
    final query = planId == null ? '' : '?plan_id=$planId&limit=100';
    final data = await _request('GET', '/withdrawals$query');
    return _list(data, 'withdrawals');
  }

  Future<List<Map<String, dynamic>>> getPlanWithdrawals(int planId) {
    return getWithdrawals(planId: planId);
  }

  Future<Map<String, dynamic>> createWithdrawal({
    required int planId,
    required double amount,
    required String reason,
  }) async {
    final data = await _request(
      'POST',
      '/withdrawals',
      body: {'plan_id': planId, 'amount': amount, 'reason': reason},
    );
    return _map(data, 'withdrawal');
  }

  Future<Map<String, dynamic>> approveWithdrawal(int id) async {
    final data = await _request('PUT', '/withdrawals/$id/approve');
    return _map(data, 'withdrawal');
  }

  Future<Map<String, dynamic>> rejectWithdrawal(int id, String reason) async {
    final data = await _request(
      'PUT',
      '/withdrawals/$id/reject',
      body: {'rejection_reason': reason},
    );
    return _map(data, 'withdrawal');
  }

  Future<List<Map<String, dynamic>>> getInvitations() async {
    final data = await _request('GET', '/invitations');
    return _list(data, 'invitations');
  }

  Future<void> acceptInvitation(int id) async {
    await _request('PUT', '/invitations/$id/accept');
  }

  Future<void> rejectInvitation(int id) async {
    await _request('PUT', '/invitations/$id/reject');
  }

  Future<List<Map<String, dynamic>>> getNotifications() async {
    final data = await _request('GET', '/notifications');
    return _list(data, 'notifications');
  }

  Future<int> getUnreadNotifications() async {
    final data = await _request('GET', '/notifications/unread-count');
    return _toInt(data['count']);
  }

  Future<void> markNotificationRead(int id) async {
    await _request('PUT', '/notifications/$id');
  }

  Future<void> deleteNotification(int id) async {
    await _request('DELETE', '/notifications/$id');
  }

  Future<void> deleteReadNotifications() async {
    await _request('DELETE', '/notifications/delete-read');
  }

  Future<void> markAllNotificationsRead() async {
    await _request('PUT', '/notifications/mark-all-read');
  }

  Future<Map<String, dynamic>> getProfile() async {
    final data = await _request('GET', '/auth/me');
    return _map(data, 'user');
  }

  Future<Map<String, dynamic>> updateProfile(
      {required String username, String? phone}) async {
    final data = await _request(
      'PUT',
      '/auth/update-profile',
      body: {'username': username, if (phone != null) 'phone': phone},
    );
    return _map(data, 'user');
  }

  Future<void> updatePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    await _request(
      'PUT',
      '/auth/update-password',
      body: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      },
    );
  }

  Future<Map<String, dynamic>> uploadProfilePhoto(File file) async {
    if (!await file.exists()) {
      throw ApiException('Profile image file was not found.');
    }

    final uri = Uri.parse('${AppConfig.apiBaseUrl}/auth/upload-photo');
    final request = await _httpClient.postUrl(uri);
    final boundary = '----savewise-${DateTime.now().millisecondsSinceEpoch}';
    request.headers.contentType = ContentType(
      'multipart',
      'form-data',
      parameters: {'boundary': boundary},
    );
    request.headers.set(HttpHeaders.acceptHeader, 'application/json');
    if (isSignedIn) {
      request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $_token');
    }

    final fileName = file.uri.pathSegments.isEmpty
        ? 'profile-image.jpg'
        : file.uri.pathSegments.last;
    final mimeType = _imageMimeType(fileName);
    request.write('--$boundary\r\n');
    request.write(
        'Content-Disposition: form-data; name="profile_picture"; filename="$fileName"\r\n');
    request.write('Content-Type: $mimeType\r\n\r\n');
    await request.addStream(file.openRead());
    request.write('\r\n--$boundary--\r\n');

    final response = await request.close();
    final responseBody = await response.transform(utf8.decoder).join();
    final decoded =
        responseBody.isEmpty ? <String, dynamic>{} : jsonDecode(responseBody);
    if (decoded is! Map<String, dynamic>) {
      throw ApiException('The server returned an unreadable response.',
          statusCode: response.statusCode);
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(_messageFrom(decoded),
          statusCode: response.statusCode);
    }
    return _map(decoded, 'user');
  }

  Future<Map<String, dynamic>> getSettings() async {
    final data = await _request('GET', '/settings');
    return _map(data, 'settings');
  }

  Future<Map<String, dynamic>> updateSettings(
      Map<String, dynamic> settings) async {
    final data = await _request('PUT', '/settings', body: settings);
    return _map(data, 'settings');
  }

  Future<Map<String, dynamic>> _request(
    String method,
    String path, {
    Map<String, dynamic>? body,
    bool authenticated = true,
  }) async {
    final uri = Uri.parse('${AppConfig.apiBaseUrl}$path');
    final request = await _httpClient.openUrl(method, uri);
    request.headers.contentType = ContentType.json;
    request.headers.set(HttpHeaders.acceptHeader, 'application/json');

    if (authenticated && isSignedIn) {
      request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $_token');
    }

    if (body != null) {
      request.write(jsonEncode(body));
    }

    final response = await request.close();
    final responseBody = await response.transform(utf8.decoder).join();
    final decoded =
        responseBody.isEmpty ? <String, dynamic>{} : jsonDecode(responseBody);

    if (decoded is! Map<String, dynamic>) {
      throw ApiException('The server returned an unreadable response.',
          statusCode: response.statusCode);
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(_messageFrom(decoded),
          statusCode: response.statusCode);
    }

    return _normalizeMap(decoded);
  }

  List<Map<String, dynamic>> _list(Map<String, dynamic> json, String key) {
    final values = json[key];
    if (values is List) return _maps(values);
    if (values is Map) {
      final combined = <Map<String, dynamic>>[];
      for (final entry in values.entries) {
        if (entry.value is List) combined.addAll(_maps(entry.value as List));
      }
      return combined;
    }
    return const [];
  }

  List<Map<String, dynamic>> _maps(List values) => values
      .whereType<Map>()
      .map((item) => _normalizeMap(Map<String, dynamic>.from(item)))
      .toList();

  Map<String, dynamic> _map(Map<String, dynamic> json, String key) {
    final value = json[key];
    if (value is Map) return _normalizeMap(Map<String, dynamic>.from(value));
    return <String, dynamic>{};
  }

  Map<String, dynamic> _normalizeMap(Map<String, dynamic> item) {
    void alias(String snake, String camel) {
      if (!item.containsKey(snake) && item.containsKey(camel)) {
        item[snake] = item[camel];
      }
      if (!item.containsKey(camel) && item.containsKey(snake)) {
        item[camel] = item[snake];
      }
    }

    alias('created_at', 'createdAt');
    alias('updated_at', 'updatedAt');
    alias('joined_at', 'joinedAt');
    alias('invited_at', 'invitedAt');
    alias('approved_at', 'approvedAt');
    alias('rejected_at', 'rejectedAt');
    alias('deposit_date', 'depositDate');
    alias('start_date', 'startDate');
    alias('end_date', 'endDate');
    alias('interest_rate', 'interestRate');
    alias('withdrawal_multiplier', 'withdrawalMultiplier');
    alias('allow_early_withdrawals', 'allowEarlyWithdrawals');
    alias('auto_approval', 'autoApproval');
    alias('rejection_reason', 'rejectionReason');

    item.updateAll((key, value) {
      if (value is Map) return _normalizeMap(Map<String, dynamic>.from(value));
      if (value is List) {
        return value
            .map((entry) => entry is Map
                ? _normalizeMap(Map<String, dynamic>.from(entry))
                : entry)
            .toList();
      }
      return value;
    });
    return item;
  }

  String _imageMimeType(String fileName) {
    final lower = fileName.toLowerCase();
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.gif')) return 'image/gif';
    if (lower.endsWith('.webp')) return 'image/webp';
    throw ApiException(
        'Only image files (jpeg, jpg, png, gif, webp) are allowed.');
  }

  String _messageFrom(Map<String, dynamic> json) {
    final errors = json['errors'];
    if (errors is List && errors.isNotEmpty) {
      final first = errors.first;
      if (first is Map && first['msg'] != null) return first['msg'].toString();
    }
    return (json['message'] ?? 'Something went wrong. Please try again.')
        .toString();
  }

  int _toInt(Object? value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }
}
