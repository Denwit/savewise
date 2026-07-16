class SavingPlan {
  const SavingPlan({
    required this.id,
    required this.name,
    required this.frequency,
    required this.cycle,
    required this.status,
    required this.targetAmount,
    required this.totalDeposits,
    required this.startDate,
    required this.endDate,
    required this.role,
    required this.description,
    required this.fixedAmount,
    required this.isFixedAmount,
    required this.interestRate,
    required this.maxMembers,
    required this.allowEarlyWithdrawals,
    required this.autoApproval,
  });

  final int id;
  final String name;
  final String frequency;
  final String cycle;
  final String status;
  final double targetAmount;
  final double totalDeposits;
  final String startDate;
  final String endDate;
  final String role;
  final String description;
  final double fixedAmount;
  final bool isFixedAmount;
  final double interestRate;
  final int maxMembers;
  final bool allowEarlyWithdrawals;
  final bool autoApproval;

  double get progress {
    if (targetAmount <= 0) return 0;
    return (totalDeposits / targetAmount).clamp(0, 1).toDouble();
  }

  factory SavingPlan.fromJson(Map<String, dynamic> json) {
    final deposits = json['deposits'];
    final total = deposits is List
        ? deposits.fold<double>(0, (sum, item) {
            if (item is! Map) return sum;
            return sum + _toDouble(item['amount']);
          })
        : _toDouble(json['total_deposits']);

    return SavingPlan(
      id: _toInt(json['id']),
      name: (json['plan_name'] ?? 'Untitled plan').toString(),
      frequency: (json['frequency'] ?? '').toString(),
      cycle: (json['cycle'] ?? '').toString(),
      status: (json['status'] ?? '').toString(),
      targetAmount: _toDouble(json['target_amount']),
      totalDeposits: total,
      startDate: (json['start_date'] ?? '').toString(),
      endDate: (json['end_date'] ?? '').toString(),
      role: (json['role'] ?? 'owner').toString(),
      description: (json['description'] ?? '').toString(),
      fixedAmount: _toDouble(json['fixed_amount']),
      isFixedAmount: _toBool(json['is_fixed_amount'], fallback: true),
      interestRate: _toDouble(
          json['interest_rate'] ?? json['interestRate'] ?? json['interest']),
      maxMembers: _toInt(json['max_members']),
      allowEarlyWithdrawals:
          _toBool(json['allow_early_withdrawals'] ?? json['allowWithdrawals']),
      autoApproval: _toBool(json['auto_approval'] ?? json['autoApproval'],
          fallback: true),
    );
  }

  static int _toInt(Object? value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

  static double _toDouble(Object? value) {
    if (value is double) return value;
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '') ?? 0;
  }

  static bool _toBool(Object? value, {bool fallback = false}) {
    if (value is bool) return value;
    if (value is num) return value != 0;
    final text = value?.toString().toLowerCase();
    if (text == 'true' || text == '1') return true;
    if (text == 'false' || text == '0') return false;
    return fallback;
  }
}
