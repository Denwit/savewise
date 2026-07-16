class DashboardSummary {
  const DashboardSummary({
    required this.totalPlans,
    required this.activePlans,
    required this.totalSavings,
    required this.totalTarget,
    required this.progress,
    required this.pendingWithdrawals,
    required this.upcomingDeposits,
  });

  final int totalPlans;
  final int activePlans;
  final double totalSavings;
  final double totalTarget;
  final double progress;
  final int pendingWithdrawals;
  final int upcomingDeposits;

  factory DashboardSummary.empty() {
    return const DashboardSummary(
      totalPlans: 0,
      activePlans: 0,
      totalSavings: 0,
      totalTarget: 0,
      progress: 0,
      pendingWithdrawals: 0,
      upcomingDeposits: 0,
    );
  }

  factory DashboardSummary.fromJson(Map<String, dynamic> json) {
    final stats = json['stats'];
    final statsMap =
        stats is Map ? Map<String, dynamic>.from(stats) : <String, dynamic>{};
    return DashboardSummary(
      totalPlans: _toInt(statsMap['total_plans'] ??
          statsMap['totalPlans'] ??
          json['totalPlans']),
      activePlans: _toInt(statsMap['active_plans'] ??
          statsMap['activePlans'] ??
          json['activePlans']),
      totalSavings: _toDouble(statsMap['total_savings'] ??
          statsMap['totalSavings'] ??
          statsMap['total_deposits'] ??
          json['totalSavings']),
      totalTarget: _toDouble(statsMap['total_target'] ??
          statsMap['totalTarget'] ??
          json['totalTarget']),
      progress: _toDouble(statsMap['progress'] ?? json['progress']),
      pendingWithdrawals: _toInt(statsMap['pending_withdrawals'] ??
          statsMap['pendingWithdrawals'] ??
          json['pendingWithdrawals']),
      upcomingDeposits: _toInt(statsMap['upcoming_deposits'] ??
          statsMap['upcomingDeposits'] ??
          json['upcomingDeposits']),
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
}
