// ignore_for_file: curly_braces_in_flow_control_structures, prefer_const_constructors

import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';

import '../api/api_client.dart';
import '../config.dart';
import '../models/dashboard_summary.dart';
import '../models/saving_plan.dart';
import '../utils/date_utils.dart';
import 'create_plan_screen.dart';
import 'plan_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen(
      {super.key,
      required this.apiClient,
      required this.username,
      required this.email,
      required this.isDarkMode,
      required this.onThemeChanged,
      required this.onSignOut});
  final ApiClient apiClient;
  final String username;
  final String email;
  final bool isDarkMode;
  final ValueChanged<bool> onThemeChanged;
  final VoidCallback onSignOut;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _money = NumberFormat.currency(symbol: 'ZMW ', decimalDigits: 2);
  late Future<_HomeData> _future;
  int _index = 0;
  int _unread = 0;
  String _search = '';

  static const _titles = [
    'Dashboard',
    'My plans',
    'Create Plan',
    'Invitations',
    'Deposits',
    'Withdraws',
    'Notifications',
    'Profile',
    'Settings'
  ];
  static const _icons = [
    Icons.dashboard_outlined,
    Icons.savings_outlined,
    Icons.add_circle_outline,
    Icons.mail_outline,
    Icons.payments_outlined,
    Icons.account_balance_wallet_outlined,
    Icons.notifications_outlined,
    Icons.person_outline,
    Icons.settings_outlined
  ];
  static const _selectedIcons = [
    Icons.dashboard,
    Icons.savings,
    Icons.add_circle,
    Icons.mail,
    Icons.payments,
    Icons.account_balance_wallet,
    Icons.notifications,
    Icons.person,
    Icons.settings
  ];

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_titles[_index]),
        actions: [
          IconButton(
              tooltip: 'Notifications',
              icon: _BadgeIcon(
                  icon: Icons.notifications_outlined, count: _unread),
              onPressed: () => setState(() => _index = 6)),
        ],
      ),
      drawer: Drawer(
        child: SafeArea(
          child: Column(children: [
            Padding(
                padding: const EdgeInsets.all(20),
                child: FutureBuilder<_HomeData>(
                  future: _future,
                  builder: (context, snapshot) => _ProfileHeader(
                      username: widget.username,
                      email: widget.email,
                      photoUrl: _profileImageUrl(
                          snapshot.data?.profile['profile_picture'])),
                )),
            const Divider(),
            Expanded(
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  for (var i = 0; i < _titles.length; i++)
                    ListTile(
                      selected: _index == i,
                      leading: _BadgeIcon(
                          icon: _index == i ? _selectedIcons[i] : _icons[i],
                          count: i == 6 ? _unread : 0),
                      title: Text(_titles[i]),
                      onTap: () {
                        Navigator.of(context).pop();
                        if (i == 2) {
                          _openCreatePlan();
                        } else {
                          setState(() => _index = i);
                        }
                      },
                    ),
                ],
              ),
            ),
            const Divider(),
            Padding(
              padding: const EdgeInsets.all(12),
              child: SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: widget.onSignOut,
                  icon: const Icon(Icons.logout),
                  label: const Text('Logout'),
                ),
              ),
            ),
          ]),
        ),
      ),
      floatingActionButton: _index == 0 || _index == 1
          ? FloatingActionButton.extended(
              onPressed: _openCreatePlan,
              icon: const Icon(Icons.add),
              label: const Text('Plan'))
          : null,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _bottomIndex,
        onDestinationSelected: (value) =>
            setState(() => _index = [0, 1, 4, 5, 7][value]),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        destinations: const [
          NavigationDestination(
              icon: Icon(Icons.home_outlined),
              selectedIcon: Icon(Icons.home),
              label: 'Home'),
          NavigationDestination(
              icon: Icon(Icons.savings_outlined),
              selectedIcon: Icon(Icons.savings),
              label: 'Plans'),
          NavigationDestination(
              icon: Icon(Icons.south_west_rounded),
              selectedIcon: Icon(Icons.south_west_rounded),
              label: 'Deposits'),
          NavigationDestination(
              icon: Icon(Icons.north_east_rounded),
              selectedIcon: Icon(Icons.north_east_rounded),
              label: 'Withdraws'),
          NavigationDestination(
              icon: Icon(Icons.person_outline),
              selectedIcon: Icon(Icons.person),
              label: 'Profile'),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: FutureBuilder<_HomeData>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting)
              return const Center(child: CircularProgressIndicator());
            if (snapshot.hasError)
              return ListView(padding: const EdgeInsets.all(16), children: [
                _ErrorState(
                    message: _errorText(snapshot.error), onRetry: _refresh)
              ]);
            final rawData = snapshot.data ?? _HomeData.empty();
            final data = (_index == 1 || _index == 4 || _index == 5)
                ? rawData.filtered(_search)
                : rawData;
            return _module(data);
          },
        ),
      ),
    );
  }

  int get _bottomIndex {
    if (_index == 1) return 1;
    if (_index == 4) return 2;
    if (_index == 5) return 3;
    if (_index == 7) return 4;
    return 0;
  }

  Widget _module(_HomeData data) {
    switch (_index) {
      case 0:
        return _DashboardView(
            apiClient: widget.apiClient,
            username: widget.username,
            email: widget.email,
            data: data,
            profile: data.profile,
            money: _money,
            onCreatePlan: _openCreatePlan,
            onOpenPlans: () => setState(() => _index = 1),
            onOpenDeposits: () => setState(() => _index = 4),
            onOpenWithdraws: () => setState(() => _index = 5));
      case 1:
        return _PlansView(
            apiClient: widget.apiClient,
            plans: data.plans,
            money: _money,
            search: _search,
            onSearchChanged: (value) => setState(() => _search = value),
            onCreatePlan: _openCreatePlan);
      case 2:
        return _CreatePlanIntro(onCreatePlan: _openCreatePlan);
      case 3:
        return _InvitationsView(
            items: data.invitations,
            onAccept: _acceptInvitation,
            onReject: _rejectInvitation,
            onOpen: _openInvitation);
      case 4:
        return _EventsView(
            title: 'Deposits',
            emptyTitle: 'No deposits yet',
            icon: Icons.payments_outlined,
            items: data.deposits,
            money: _money,
            search: _search,
            onSearchChanged: (value) => setState(() => _search = value),
            actionLabel: 'Record deposit',
            onAction: data.plans.isEmpty
                ? null
                : () => _openDepositDialog(data.plans),
            onItemTap: _openDepositAction);
      case 5:
        return _EventsView(
            title: 'Withdraws',
            emptyTitle: 'No withdraws yet',
            icon: Icons.account_balance_wallet_outlined,
            items: data.withdrawals,
            money: _money,
            search: _search,
            onSearchChanged: (value) => setState(() => _search = value),
            actionLabel: 'Request withdraw',
            onAction: data.plans.isEmpty
                ? null
                : () => _openWithdrawalDialog(data.plans),
            onItemTap: _openWithdrawalAction);
      case 6:
        return _NotificationsView(
            items: data.notifications,
            onOpen: _openNotification,
            onDelete: _deleteNotification,
            onMarkAllRead: _markAllNotificationsRead,
            onDeleteRead: _deleteReadNotifications);
      case 7:
        return _ProfileView(
            apiClient: widget.apiClient,
            username: widget.username,
            email: widget.email,
            money: _money);
      default:
        return _SettingsView(
            apiClient: widget.apiClient,
            isDarkMode: widget.isDarkMode,
            onThemeChanged: widget.onThemeChanged);
    }
  }

  Future<_HomeData> _load() async {
    final results = await Future.wait([
      widget.apiClient.getDashboard(),
      widget.apiClient.getPlans(),
      widget.apiClient.getInvitations(),
      widget.apiClient.getDeposits(),
      widget.apiClient.getWithdrawals(),
      widget.apiClient.getNotifications(),
      widget.apiClient.getUnreadNotifications(),
      widget.apiClient.getProfile()
    ]);
    final unread = results[6] as int;
    if (mounted) setState(() => _unread = unread);
    return _HomeData(
        summary: results[0] as DashboardSummary,
        plans: results[1] as List<SavingPlan>,
        invitations: results[2] as List<Map<String, dynamic>>,
        deposits: results[3] as List<Map<String, dynamic>>,
        withdrawals: results[4] as List<Map<String, dynamic>>,
        notifications: results[5] as List<Map<String, dynamic>>,
        profile: results[7] as Map<String, dynamic>);
  }

  Future<void> _refresh() async {
    final next = _load();
    setState(() {
      _future = next;
    });
    await next;
  }

  Future<void> _openCreatePlan() async {
    final created = await Navigator.of(context).push<bool>(MaterialPageRoute(
        builder: (_) => CreatePlanScreen(apiClient: widget.apiClient)));
    if (created == true) {
      setState(() => _index = 1);
      await _refresh();
    }
  }

  Future<void> _openDepositDialog(List<SavingPlan> plans) async {
    final ok = await showModalBottomSheet<bool>(
        context: context,
        isScrollControlled: true,
        builder: (_) =>
            _DepositForm(apiClient: widget.apiClient, plans: plans));
    if (ok == true) await _refresh();
  }

  Future<void> _openDepositAction(Map<String, dynamic> item) async {
    final id = _toInt(item['id']);
    final status = _text(item['status'], fallback: 'pending').toLowerCase();
    final plan = _asMap(item['plan']);
    final user = _asMap(item['user']);
    final notes = _text(item['notes']);
    final amount = _money.format(_toDouble(item['amount']));
    final originalAmount = _toDouble(item['original_amount']) > 0
        ? _money.format(_toDouble(item['original_amount']))
        : amount;
    final planName = _text(plan['plan_name'], fallback: 'Plan');
    final memberName = _text(user['username'], fallback: 'Member');
    final depositedAt = formatSaveWiseDateTime(
        item['deposit_date'] ?? item['created_at'] ?? item['updated_at']);
    final canApprove = _toBool(item['can_approve']);
    final action = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        titlePadding: const EdgeInsets.fromLTRB(24, 18, 8, 0),
        title: Row(children: [
          const Expanded(child: Text('Deposit details')),
          IconButton(
              tooltip: 'Close',
              onPressed: () => Navigator.of(context).pop(),
              icon: const Icon(Icons.close)),
        ]),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _DetailLine(label: 'Plan', value: planName),
            _DetailLine(label: 'Member', value: memberName),
            _DetailLine(label: 'Amount', value: amount),
            if (originalAmount != amount)
              _DetailLine(label: 'Original', value: originalAmount),
            _DetailLine(label: 'Status', value: status),
            _DetailLine(label: 'Deposited', value: depositedAt),
            if (notes.isNotEmpty) _DetailLine(label: 'Notes', value: notes),
          ],
        ),
        actionsAlignment: MainAxisAlignment.end,
        actions: [
          if (id > 0 && canApprove && status == 'pending')
            OutlinedButton.icon(
                onPressed: () => Navigator.of(context).pop('reject'),
                icon: const Icon(Icons.close),
                label: const Text('Reject')),
          if (id > 0 && canApprove && status == 'pending')
            FilledButton.icon(
                onPressed: () => Navigator.of(context).pop('approve'),
                icon: const Icon(Icons.check),
                label: const Text('Approve')),
        ],
      ),
    );
    if (action == 'approve') {
      await _runAction(() async {
        await widget.apiClient.approveDeposit(id);
      }, 'Deposit approved');
    } else if (action == 'reject') {
      final reason = await _askRejectReason();
      if (reason != null) {
        await _runAction(() async {
          await widget.apiClient.rejectDeposit(id, reason);
        }, 'Deposit rejected');
      }
    }
  }

  Future<void> _openWithdrawalDialog(List<SavingPlan> plans) async {
    final ok = await showModalBottomSheet<bool>(
        context: context,
        isScrollControlled: true,
        builder: (_) =>
            _WithdrawalForm(apiClient: widget.apiClient, plans: plans));
    if (ok == true) await _refresh();
  }

  Future<void> _openWithdrawalAction(Map<String, dynamic> item) async {
    final id = _toInt(item['id']);
    final status = _text(item['status'], fallback: 'pending').toLowerCase();
    final plan = _asMap(item['plan']);
    final user = _asMap(item['user']);
    final reason = _text(item['reason']);
    final amount = _money.format(_toDouble(item['amount']));
    final planName = _text(plan['plan_name'], fallback: 'Plan');
    final memberName = _text(user['username'], fallback: 'Member');
    final requestedAt = formatSaveWiseDateTime(item['created_at']);
    final action = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        titlePadding: const EdgeInsets.fromLTRB(24, 18, 8, 0),
        title: Row(children: [
          const Expanded(child: Text('Withdraw details')),
          IconButton(
              tooltip: 'Close',
              onPressed: () => Navigator.of(context).pop(),
              icon: const Icon(Icons.close)),
        ]),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _DetailLine(label: 'Plan', value: planName),
            _DetailLine(label: 'Member', value: memberName),
            _DetailLine(label: 'Amount', value: amount),
            _DetailLine(label: 'Status', value: status),
            _DetailLine(label: 'Requested', value: requestedAt),
            if (reason.isNotEmpty) _DetailLine(label: 'Reason', value: reason),
          ],
        ),
        actionsAlignment: MainAxisAlignment.end,
        actions: [
          if (id > 0 && status == 'pending')
            OutlinedButton.icon(
                onPressed: () => Navigator.of(context).pop('reject'),
                icon: const Icon(Icons.close),
                label: const Text('Reject')),
          if (id > 0 && status == 'pending')
            FilledButton.icon(
                onPressed: () => Navigator.of(context).pop('approve'),
                icon: const Icon(Icons.check),
                label: const Text('Approve')),
        ],
      ),
    );
    if (action == 'approve') {
      await _runAction(() async {
        await widget.apiClient.approveWithdrawal(id);
      }, 'Withdrawal approved');
    } else if (action == 'reject') {
      final reason = await _askRejectReason();
      if (reason != null) {
        await _runAction(() async {
          await widget.apiClient.rejectWithdrawal(id, reason);
        }, 'Withdrawal rejected');
      }
    }
  }

  Future<String?> _askRejectReason() async {
    final controller = TextEditingController();
    final result = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reject withdraw'),
        content: TextField(
          controller: controller,
          minLines: 2,
          maxLines: 4,
          decoration: const InputDecoration(labelText: 'Reason'),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel')),
          FilledButton(
              onPressed: () =>
                  Navigator.of(context).pop(controller.text.trim()),
              child: const Text('Reject')),
        ],
      ),
    );
    controller.dispose();
    return result == null || result.isEmpty ? null : result;
  }

  Future<void> _openInvitation(Map<String, dynamic> item) async {
    final plan = _asMap(item['plan']);
    final inviter = _asMap(item['inviter'] ?? item['invitedBy']);
    final id = _toInt(item['plan_id'] ?? plan['id']);
    final status = _text(item['status'], fallback: 'pending').toLowerCase();
    final planName = _text(item['plan_name'],
        fallback: _text(plan['plan_name'], fallback: 'Plan invitation'));
    final description = _text(plan['description']);
    final target = _toDouble(plan['target_amount']) > 0
        ? _money.format(_toDouble(plan['target_amount']))
        : 'Not set';
    final inviterName = _text(inviter['username'],
        fallback: _text(item['invited_by_name'] ?? item['invitedByName'],
            fallback: _text(item['invited_by'], fallback: 'SaveWise user')));
    final invitedAt = formatSaveWiseDateTime(item['invited_at'] ??
        item['created_at'] ??
        item['createdAt'] ??
        item['updated_at']);
    final rejectionReason = _text(item['rejection_reason'] ??
        item['rejectionReason'] ??
        item['reason'] ??
        item['notes']);

    final action = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(planName),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _DetailLine(
                label: 'Status',
                value: status == 'active' ? 'accepted' : status),
            _DetailLine(label: 'Invited by', value: inviterName),
            _DetailLine(label: 'Invitation date', value: invitedAt),
            _DetailLine(label: 'Target', value: target),
            if (description.isNotEmpty)
              _DetailLine(label: 'Details', value: description),
            if (status == 'rejected')
              _DetailLine(
                  label: 'Reason',
                  value: rejectionReason.isEmpty
                      ? 'No rejection reason provided'
                      : rejectionReason),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Close')),
          if (status == 'active' && id > 0)
            FilledButton.icon(
                onPressed: () => Navigator.of(context).pop('plan'),
                icon: const Icon(Icons.open_in_new),
                label: const Text('Go to plan')),
        ],
      ),
    );
    if (action == 'plan' && mounted) {
      await Navigator.of(context).push(MaterialPageRoute(
          builder: (_) =>
              PlanDetailScreen(apiClient: widget.apiClient, planId: id)));
      await _refresh();
    }
  }

  Future<void> _acceptInvitation(int id) => _runAction(
      () => widget.apiClient.acceptInvitation(id), 'Invitation accepted');
  Future<void> _rejectInvitation(int id) => _runAction(
      () => widget.apiClient.rejectInvitation(id), 'Invitation rejected');
  Future<void> _openNotification(Map<String, dynamic> item) async {
    final id = _toInt(item['id']);
    if (id > 0 && !_toBool(item['is_read'])) {
      try {
        await widget.apiClient.markNotificationRead(id);
        await _refresh();
      } on ApiException catch (error) {
        if (mounted) {
          ScaffoldMessenger.of(context)
              .showSnackBar(SnackBar(content: Text(error.message)));
        }
      }
    }
    if (!mounted) return;
    await showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(_text(item['title'], fallback: 'Notification')),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(_text(item['message'], fallback: 'No message available.')),
            const SizedBox(height: 12),
            Text(formatSaveWiseDateTime(item['created_at']),
                style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
        actions: [
          if (id > 0)
            TextButton.icon(
              onPressed: () {
                Navigator.of(context).pop();
                _deleteNotification(id);
              },
              icon: const Icon(Icons.delete_outline),
              label: const Text('Delete'),
            ),
          FilledButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Close')),
        ],
      ),
    );
  }

  Future<void> _deleteNotification(int id) => _runAction(
      () => widget.apiClient.deleteNotification(id), 'Notification deleted');
  Future<void> _deleteReadNotifications() => _runAction(
      widget.apiClient.deleteReadNotifications, 'Read notifications deleted');
  Future<void> _markAllNotificationsRead() => _runAction(
      widget.apiClient.markAllNotificationsRead,
      'Notifications marked as read');

  Future<void> _runAction(
      Future<void> Function() action, String message) async {
    try {
      await action();
      if (mounted)
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(message)));
      await _refresh();
    } on ApiException catch (error) {
      if (mounted)
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(error.message)));
    }
  }

  String _errorText(Object? error) => error is ApiException
      ? error.message
      : 'Could not load SaveWise data. Check that the backend and local MySQL database are running.';
}

class _HomeData {
  const _HomeData(
      {required this.summary,
      required this.plans,
      required this.invitations,
      required this.deposits,
      required this.withdrawals,
      required this.notifications,
      required this.profile});
  final DashboardSummary summary;
  final List<SavingPlan> plans;
  final List<Map<String, dynamic>> invitations;
  final List<Map<String, dynamic>> deposits;
  final List<Map<String, dynamic>> withdrawals;
  final List<Map<String, dynamic>> notifications;
  final Map<String, dynamic> profile;

  _HomeData filtered(String query) {
    final q = query.trim().toLowerCase();
    if (q.isEmpty) return this;
    bool has(Object? value) =>
        value?.toString().toLowerCase().contains(q) == true;
    bool mapHas(Map<String, dynamic> item) =>
        item.values.any(has) ||
        _asMap(item['plan']).values.any(has) ||
        _asMap(item['user']).values.any(has) ||
        _asMap(item['inviter']).values.any(has);
    return _HomeData(
      summary: summary,
      plans: plans
          .where((plan) =>
              has(plan.name) ||
              has(plan.frequency) ||
              has(plan.cycle) ||
              has(plan.status) ||
              has(plan.role))
          .toList(),
      invitations: invitations.where(mapHas).toList(),
      deposits: deposits.where(mapHas).toList(),
      withdrawals: withdrawals.where(mapHas).toList(),
      notifications: notifications.where(mapHas).toList(),
      profile: profile,
    );
  }

  factory _HomeData.empty() => _HomeData(
      summary: DashboardSummary.empty(),
      plans: const [],
      invitations: const [],
      deposits: const [],
      withdrawals: const [],
      notifications: const [],
      profile: const {});
}

class _DashboardView extends StatelessWidget {
  const _DashboardView(
      {required this.apiClient,
      required this.username,
      required this.email,
      required this.data,
      required this.profile,
      required this.money,
      required this.onCreatePlan,
      required this.onOpenPlans,
      required this.onOpenDeposits,
      required this.onOpenWithdraws});
  final ApiClient apiClient;
  final String username;
  final String email;
  final _HomeData data;
  final Map<String, dynamic> profile;
  final NumberFormat money;
  final VoidCallback onCreatePlan;
  final VoidCallback onOpenPlans;
  final VoidCallback onOpenDeposits;
  final VoidCallback onOpenWithdraws;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 96),
      children: [
        _ProfileHeader(
            username: _text(profile['username'], fallback: username),
            email: _text(profile['email'], fallback: email),
            photoUrl: _profileImageUrl(profile['profile_picture'])),
        const SizedBox(height: 16),
        _SummaryPanel(summary: data.summary, money: money),
        const SizedBox(height: 14),
        _QuickActionStrip(
          onCreatePlan: onCreatePlan,
          onOpenPlans: onOpenPlans,
          onDeposits: onOpenDeposits,
          onWithdraws: onOpenWithdraws,
        ),
        const SizedBox(height: 22),
        _SectionTitle(
            title: 'Saving accounts', trailing: '${data.plans.length} plans'),
        const SizedBox(height: 10),
        if (data.plans.isEmpty)
          const _EmptyState(
              icon: Icons.savings_outlined,
              title: 'No saving plans yet',
              message: 'Create a plan to start tracking contributions.')
        else
          SizedBox(
            height: 244,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: data.plans.take(6).length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (context, index) {
                final plan = data.plans[index];
                return SizedBox(
                  width: 286,
                  child: _PlanTile(
                    plan: plan,
                    money: money,
                    compact: true,
                    onTap: () => Navigator.of(context).push(MaterialPageRoute(
                        builder: (_) => PlanDetailScreen(
                            apiClient: apiClient, planId: plan.id))),
                  ),
                );
              },
            ),
          ),
        const SizedBox(height: 22),
        _SectionTitle(
            title: 'Recent deposits',
            trailing: '${data.deposits.length} total'),
        const SizedBox(height: 10),
        if (data.deposits.isEmpty)
          const _EmptyState(
              icon: Icons.payments_outlined,
              title: 'No deposits yet',
              message: 'Deposits will appear here after members contribute.')
        else
          ...data.deposits.take(4).map((item) => _MoneyEventTile(
              item: item, money: money, fallbackTitle: 'Deposit')),
        const SizedBox(height: 18),
        _SectionTitle(
            title: 'Withdraw requests',
            trailing: '${data.withdrawals.length} total'),
        const SizedBox(height: 10),
        if (data.withdrawals.isEmpty)
          const _EmptyState(
              icon: Icons.account_balance_wallet_outlined,
              title: 'No withdraws yet',
              message: 'Member withdraw requests will appear here.')
        else
          ...data.withdrawals.take(4).map((item) => _MoneyEventTile(
              item: item, money: money, fallbackTitle: 'Withdrawal')),
      ],
    );
  }
}

class _PlansView extends StatelessWidget {
  const _PlansView(
      {required this.apiClient,
      required this.plans,
      required this.money,
      required this.search,
      required this.onSearchChanged,
      required this.onCreatePlan});
  final ApiClient apiClient;
  final List<SavingPlan> plans;
  final NumberFormat money;
  final String search;
  final ValueChanged<String> onSearchChanged;
  final VoidCallback onCreatePlan;
  @override
  Widget build(BuildContext context) =>
      ListView(padding: const EdgeInsets.fromLTRB(16, 8, 16, 96), children: [
        _SearchField(
            value: search,
            hintText: 'Search plans',
            onChanged: onSearchChanged),
        const SizedBox(height: 14),
        _SectionTitle(title: 'My plans', trailing: '${plans.length}'),
        const SizedBox(height: 10),
        if (plans.isEmpty)
          _EmptyState(
              icon: Icons.savings_outlined,
              title: 'No saving plans yet',
              message: 'Create your first saving plan.',
              actionLabel: 'Create plan',
              onAction: onCreatePlan)
        else
          ...plans.map((plan) => _PlanTile(
              plan: plan,
              money: money,
              onTap: () => Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) => PlanDetailScreen(
                      apiClient: apiClient, planId: plan.id)))))
      ]);
}

class _CreatePlanIntro extends StatelessWidget {
  const _CreatePlanIntro({required this.onCreatePlan});
  final VoidCallback onCreatePlan;
  @override
  Widget build(BuildContext context) =>
      ListView(padding: const EdgeInsets.all(16), children: [
        _EmptyState(
            icon: Icons.add_circle_outline,
            title: 'Create a saving plan',
            message:
                'Set the target, dates, contribution frequency, and member limit for a new plan.',
            actionLabel: 'Open create plan',
            onAction: onCreatePlan)
      ]);
}

class _InvitationsView extends StatelessWidget {
  const _InvitationsView(
      {required this.items,
      required this.onAccept,
      required this.onReject,
      required this.onOpen});
  final List<Map<String, dynamic>> items;
  final ValueChanged<int> onAccept;
  final ValueChanged<int> onReject;
  final ValueChanged<Map<String, dynamic>> onOpen;

  @override
  Widget build(BuildContext context) {
    final statuses = ['pending', 'active', 'rejected'];
    return DefaultTabController(
      length: statuses.length,
      child: Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
          child:
              _SectionTitle(title: 'Invitations', trailing: '${items.length}'),
        ),
        TabBar(
          tabs: [
            for (final status in statuses)
              Tab(text: '${_statusLabel(status)} (${_countStatus(status)})'),
          ],
        ),
        Expanded(
          child: TabBarView(
            children: [
              for (final status in statuses)
                _InvitationList(
                  items: items
                      .where((item) =>
                          _text(item['status'], fallback: 'pending')
                              .toLowerCase() ==
                          status)
                      .toList(),
                  status: status,
                  onAccept: onAccept,
                  onReject: onReject,
                  onOpen: onOpen,
                ),
            ],
          ),
        ),
      ]),
    );
  }

  int _countStatus(String status) => items
      .where((item) =>
          _text(item['status'], fallback: 'pending').toLowerCase() == status)
      .length;

  String _statusLabel(String status) => status == 'active'
      ? 'Accepted'
      : status.isEmpty
          ? status
          : '${status[0].toUpperCase()}${status.substring(1)}';
}

class _InvitationList extends StatelessWidget {
  const _InvitationList(
      {required this.items,
      required this.status,
      required this.onAccept,
      required this.onReject,
      required this.onOpen});
  final List<Map<String, dynamic>> items;
  final String status;
  final ValueChanged<int> onAccept;
  final ValueChanged<int> onReject;
  final ValueChanged<Map<String, dynamic>> onOpen;

  @override
  Widget build(BuildContext context) => ListView(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 96),
        children: [
          if (items.isEmpty)
            _EmptyState(
                icon: Icons.mail_outline,
                title:
                    'No ${status == 'active' ? 'accepted' : status} invitations',
                message: 'Invitations with this status will appear here.')
          else
            ...items.map((item) {
              final plan = _asMap(item['plan']);
              final inviter = _asMap(item['inviter'] ?? item['invitedBy']);
              final id = _toInt(item['id']);
              final planName = _text(item['plan_name'],
                  fallback:
                      _text(plan['plan_name'], fallback: 'Plan invitation'));
              final inviterName = _text(inviter['username'],
                  fallback: _text(
                      item['invited_by_name'] ?? item['invitedByName'],
                      fallback: _text(item['invited_by'],
                          fallback: 'SaveWise user')));
              final invitee = _text(item['user_email'] ?? item['email']);
              final inviteDate = formatSaveWiseDateTime(item['created_at'] ??
                  item['invited_at'] ??
                  item['updated_at']);
              final parts = [
                'From $inviterName',
                if (invitee.isNotEmpty) invitee,
                inviteDate,
              ].where((part) => part.isNotEmpty).join(' - ');
              return _InfoCard(
                  onTap: () => onOpen(item),
                  icon: Icons.mail_outline,
                  title: planName,
                  subtitle: parts,
                  trailing: status == 'pending'
                      ? Row(mainAxisSize: MainAxisSize.min, children: [
                          IconButton.filledTonal(
                              tooltip: 'Accept',
                              onPressed: id > 0 ? () => onAccept(id) : null,
                              icon: const Icon(Icons.check)),
                          const SizedBox(width: 6),
                          IconButton.outlined(
                              tooltip: 'Reject',
                              onPressed: id > 0 ? () => onReject(id) : null,
                              icon: const Icon(Icons.close))
                        ])
                      : _StatusChip(status == 'active' ? 'accepted' : status));
            }),
        ],
      );
}

class _EventsView extends StatelessWidget {
  const _EventsView(
      {required this.title,
      required this.emptyTitle,
      required this.icon,
      required this.items,
      required this.money,
      required this.search,
      required this.onSearchChanged,
      required this.actionLabel,
      required this.onAction,
      this.onItemTap});
  final String title;
  final String emptyTitle;
  final IconData icon;
  final List<Map<String, dynamic>> items;
  final NumberFormat money;
  final String search;
  final ValueChanged<String> onSearchChanged;
  final String actionLabel;
  final VoidCallback? onAction;
  final ValueChanged<Map<String, dynamic>>? onItemTap;
  @override
  Widget build(BuildContext context) => ListView(
        padding: const EdgeInsets.fromLTRB(0, 0, 0, 96),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            child: _SearchField(
                value: search,
                hintText: 'Search ${title.toLowerCase()}',
                onChanged: onSearchChanged),
          ),
          Container(
            color: const Color(0xFFEAF2FF),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(children: [
              const Text('By date',
                  style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(width: 6),
              const Icon(Icons.arrow_upward, size: 18),
              const Spacer(),
              Text(
                  '${items.length} ${items.length == 1 ? 'transaction' : 'transactions'}'),
            ]),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 10),
            child: FilledButton.icon(
                onPressed: onAction,
                icon: const Icon(Icons.add),
                label: Text(actionLabel)),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: _SectionTitle(title: title, trailing: '${items.length}'),
          ),
          const SizedBox(height: 8),
          if (items.isEmpty)
            Padding(
              padding: const EdgeInsets.all(16),
              child: _EmptyState(
                  icon: icon,
                  title: emptyTitle,
                  message: '$title will appear here.'),
            )
          else
            ...items.map((item) => _MoneyEventTile(
                item: item,
                money: money,
                fallbackTitle: title == 'Deposits' ? 'Deposit' : 'Withdrawal',
                onTap: onItemTap == null ? null : () => onItemTap!(item)))
        ],
      );
}

class _SearchField extends StatelessWidget {
  const _SearchField(
      {required this.value, required this.hintText, required this.onChanged});
  final String value;
  final String hintText;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) => TextField(
        controller: TextEditingController(text: value)
          ..selection = TextSelection.collapsed(offset: value.length),
        decoration: InputDecoration(
          hintText: hintText,
          prefixIcon: const Icon(Icons.search),
          suffixIcon: value.isEmpty
              ? null
              : IconButton(
                  tooltip: 'Clear search',
                  onPressed: () => onChanged(''),
                  icon: const Icon(Icons.close),
                ),
        ),
        onChanged: onChanged,
      );
}

class _DetailLine extends StatelessWidget {
  const _DetailLine({required this.label, required this.value});
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          SizedBox(
              width: 86,
              child: Text(label,
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant))),
          Expanded(
              child: Text(value.isEmpty ? 'Not set' : value,
                  style: Theme.of(context)
                      .textTheme
                      .bodyMedium
                      ?.copyWith(fontWeight: FontWeight.w700))),
        ]),
      );
}

class _NotificationsView extends StatelessWidget {
  const _NotificationsView({
    required this.items,
    required this.onOpen,
    required this.onDelete,
    required this.onMarkAllRead,
    required this.onDeleteRead,
  });
  final List<Map<String, dynamic>> items;
  final ValueChanged<Map<String, dynamic>> onOpen;
  final ValueChanged<int> onDelete;
  final VoidCallback onMarkAllRead;
  final VoidCallback onDeleteRead;
  @override
  Widget build(BuildContext context) =>
      ListView(padding: const EdgeInsets.fromLTRB(16, 8, 16, 96), children: [
        Row(children: [
          Expanded(
            child: FilledButton.icon(
                onPressed: items.isEmpty ? null : onMarkAllRead,
                icon: const Icon(Icons.done_all),
                label: const Text('Mark all read')),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: OutlinedButton.icon(
                onPressed: items.any((item) => _toBool(item['is_read']))
                    ? onDeleteRead
                    : null,
                icon: const Icon(Icons.delete_sweep_outlined),
                label: const Text('Delete read')),
          ),
        ]),
        const SizedBox(height: 16),
        _SectionTitle(title: 'Notifications', trailing: '${items.length}'),
        const SizedBox(height: 10),
        if (items.isEmpty)
          const _EmptyState(
              icon: Icons.notifications_outlined,
              title: 'No notifications',
              message: 'Updates and approvals will appear here.')
        else
          ...items.map((item) {
            final isRead = _toBool(item['is_read']);
            final id = _toInt(item['id']);
            return _InfoCard(
              icon: isRead
                  ? Icons.notifications_none
                  : Icons.notifications_active,
              title: _text(item['title'], fallback: 'Notification'),
              subtitle: _text(item['message']),
              onTap: () => onOpen(item),
              trailing: IconButton(
                tooltip: 'Delete notification',
                onPressed: id > 0 ? () => onDelete(id) : null,
                icon: const Icon(Icons.delete_outline),
              ),
            );
          })
      ]);
}

class _ProfileView extends StatefulWidget {
  const _ProfileView(
      {required this.apiClient,
      required this.username,
      required this.email,
      required this.money});
  final ApiClient apiClient;
  final String username;
  final String email;
  final NumberFormat money;
  @override
  State<_ProfileView> createState() => _ProfileViewState();
}

class _ProfileViewState extends State<_ProfileView> {
  late Future<Map<String, dynamic>> _future;
  final _username = TextEditingController();
  final _phone = TextEditingController();
  bool _editing = false;
  bool _saving = false;
  bool _uploading = false;

  @override
  void initState() {
    super.initState();
    _future = _loadProfile();
  }

  @override
  void dispose() {
    _username.dispose();
    _phone.dispose();
    super.dispose();
  }

  Future<Map<String, dynamic>> _loadProfile() async {
    final profile = await widget.apiClient.getProfile();
    if (mounted) {
      _username.text = _text(profile['username'], fallback: widget.username);
      _phone.text = _text(profile['phone']);
    }
    return profile;
  }

  @override
  Widget build(BuildContext context) => FutureBuilder<Map<String, dynamic>>(
        future: _future,
        builder: (context, snapshot) {
          final profile = snapshot.data ?? <String, dynamic>{};
          final settings = _asMap(profile['settings']);
          final username =
              _text(profile['username'], fallback: widget.username);
          final email = _text(profile['email'], fallback: widget.email);
          final photo = _profileImageUrl(profile['profile_picture']);
          return ListView(
              padding: const EdgeInsets.fromLTRB(16, 24, 16, 96),
              children: [
                Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  CircleAvatar(
                    radius: 38,
                    backgroundColor:
                        Theme.of(context).colorScheme.primaryContainer,
                    backgroundImage: photo == null ? null : NetworkImage(photo),
                    child: photo == null
                        ? Text(
                            username.isEmpty ? 'S' : username[0].toUpperCase(),
                            style: Theme.of(context).textTheme.headlineSmall)
                        : null,
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(username,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context)
                                  .textTheme
                                  .titleLarge
                                  ?.copyWith(fontWeight: FontWeight.w800)),
                          Text(email,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.bodyMedium),
                          const SizedBox(height: 8),
                          Wrap(spacing: 8, runSpacing: 8, children: [
                            Chip(
                                avatar: const Icon(Icons.verified_user_outlined,
                                    size: 18),
                                label: Text(
                                    _toBool(settings['two_factor_enabled'])
                                        ? '2FA enabled'
                                        : '2FA off')),
                            Chip(
                                avatar: const Icon(
                                    Icons.calendar_today_outlined,
                                    size: 18),
                                label: Text(
                                    'Joined ${formatSaveWiseDate(profile['created_at'])}')),
                          ]),
                        ]),
                  ),
                  IconButton.filledTonal(
                      tooltip: _editing ? 'Cancel edit' : 'Edit profile',
                      onPressed: () => setState(() => _editing = !_editing),
                      icon: Icon(_editing ? Icons.close : Icons.edit_outlined)),
                ]),
                const SizedBox(height: 16),
                if (_editing) ...[
                  TextField(
                      controller: _username,
                      decoration: const InputDecoration(
                          labelText: 'Username',
                          prefixIcon: Icon(Icons.person_outline))),
                  const SizedBox(height: 12),
                  TextField(
                      controller: _phone,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                          labelText: 'Phone',
                          prefixIcon: Icon(Icons.phone_outlined))),
                  const SizedBox(height: 12),
                  FilledButton.icon(
                      onPressed: _saving ? null : _saveProfile,
                      icon: const Icon(Icons.save_outlined),
                      label: Text(_saving ? 'Saving...' : 'Save profile')),
                  const SizedBox(height: 18),
                ],
                Row(children: [
                  Expanded(
                    child: OutlinedButton.icon(
                        onPressed: _uploading ? null : _pickAndUploadPhoto,
                        icon: const Icon(Icons.add_photo_alternate_outlined),
                        label:
                            Text(_uploading ? 'Uploading...' : 'Upload photo')),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton.icon(
                        onPressed: _changePassword,
                        icon: const Icon(Icons.lock_reset_outlined),
                        label: const Text('Password')),
                  ),
                ]),
                const SizedBox(height: 18),
                _InfoCard(
                    icon: Icons.phone_outlined,
                    title: 'Phone',
                    subtitle: _text(profile['phone'], fallback: 'Not set')),
                _InfoCard(
                    icon: Icons.email_outlined,
                    title: 'Email',
                    subtitle: email),
                const SizedBox(height: 16),
                _SectionTitle(title: 'Account summary'),
                const SizedBox(height: 10),
                Column(children: [
                  _InfoCard(
                      icon: Icons.verified_user_outlined,
                      title: 'Account Status',
                      subtitle: _toBool(profile['is_active'], fallback: true)
                          ? 'Active'
                          : 'Inactive'),
                  _InfoCard(
                      icon: Icons.mark_email_read_outlined,
                      title: 'Email Verified',
                      subtitle: _toBool(profile['email_verified'])
                          ? 'Verified'
                          : 'Pending'),
                  _InfoCard(
                      icon: Icons.phone_android_outlined,
                      title: 'Phone Verified',
                      subtitle: _toBool(profile['phone_verified'])
                          ? 'Verified'
                          : 'Pending'),
                  _InfoCard(
                      icon: Icons.history_outlined,
                      title: 'Account Age',
                      subtitle: _accountAge(profile['created_at'])),
                ]),
                if (snapshot.connectionState == ConnectionState.waiting)
                  const Padding(
                      padding: EdgeInsets.only(top: 16),
                      child: LinearProgressIndicator())
              ]);
        },
      );

  Future<void> _saveProfile() async {
    setState(() => _saving = true);
    try {
      await widget.apiClient.updateProfile(
          username: _username.text.trim(), phone: _phone.text.trim());
      if (mounted) {
        setState(() {
          _editing = false;
          _future = _loadProfile();
        });
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Profile updated successfully')));
      }
    } on ApiException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(error.message)));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _changePassword() async {
    final current = TextEditingController();
    final next = TextEditingController();
    final confirm = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Change password'),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          TextField(
              controller: current,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Current password')),
          const SizedBox(height: 10),
          TextField(
              controller: next,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'New password')),
          const SizedBox(height: 10),
          TextField(
              controller: confirm,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Confirm password')),
        ]),
        actions: [
          TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Cancel')),
          FilledButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: const Text('Update')),
        ],
      ),
    );
    if (ok != true) {
      current.dispose();
      next.dispose();
      confirm.dispose();
      return;
    }
    try {
      if (next.text.trim().length < 6) {
        throw ApiException('New password must be at least 6 characters.');
      }
      if (next.text.trim() != confirm.text.trim()) {
        throw ApiException('New passwords do not match.');
      }
      await widget.apiClient.updatePassword(
          currentPassword: current.text, newPassword: next.text.trim());
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Password updated successfully')));
      }
    } on ApiException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(error.message)));
      }
    } finally {
      current.dispose();
      next.dispose();
      confirm.dispose();
    }
  }

  Future<void> _pickAndUploadPhoto() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery);
    if (picked == null) return;
    setState(() => _uploading = true);
    try {
      await widget.apiClient.uploadProfilePhoto(File(picked.path));
      if (mounted) {
        final next = _loadProfile();
        setState(() {
          _future = next;
        });
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Profile photo uploaded')));
      }
    } on ApiException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(error.message)));
      }
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }
}

class _SettingsView extends StatefulWidget {
  const _SettingsView(
      {required this.apiClient,
      required this.isDarkMode,
      required this.onThemeChanged});
  final ApiClient apiClient;
  final bool isDarkMode;
  final ValueChanged<bool> onThemeChanged;
  @override
  State<_SettingsView> createState() => _SettingsViewState();
}

class _SettingsViewState extends State<_SettingsView> {
  late Future<Map<String, dynamic>> _future;
  bool _email = true;
  bool _sms = false;
  int _reminderDays = 2;
  String _currency = 'ZMW';
  String _language = 'en';
  String _theme = 'light';
  bool _saving = false;
  bool _autoSaveDrafts = true;
  bool _showProfile = true;
  bool _allowInvites = true;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  @override
  Widget build(BuildContext context) => FutureBuilder<Map<String, dynamic>>(
        future: _future,
        builder: (context, snapshot) => ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
            children: [
              _SectionTitle(title: 'General Settings'),
              const SizedBox(height: 8),
              SwitchListTile(
                  value: _autoSaveDrafts,
                  onChanged: (value) => setState(() => _autoSaveDrafts = value),
                  title: const Text('Auto-Save Drafts'),
                  subtitle: const Text('Automatically save plan drafts'),
                  secondary: const Icon(Icons.save_outlined)),
              SwitchListTile(
                  value: _showProfile,
                  onChanged: (value) => setState(() => _showProfile = value),
                  title: const Text('Show Profile to Others'),
                  subtitle: const Text('Allow other users to see your profile'),
                  secondary: const Icon(Icons.person_search_outlined)),
              SwitchListTile(
                  value: _allowInvites,
                  onChanged: (value) => setState(() => _allowInvites = value),
                  title: const Text('Allow Invites'),
                  subtitle: const Text('Allow others to invite you to plans'),
                  secondary: const Icon(Icons.mail_outline)),
              const SizedBox(height: 18),
              _SectionTitle(title: 'Notification preferences'),
              const SizedBox(height: 8),
              SwitchListTile(
                  value: _email,
                  onChanged: (value) => setState(() => _email = value),
                  title: const Text('Email notifications'),
                  subtitle: const Text('Receive important account updates'),
                  secondary: const Icon(Icons.email_outlined)),
              SwitchListTile(
                  value: _sms,
                  onChanged: (value) => setState(() => _sms = value),
                  title: const Text('SMS notifications'),
                  subtitle: const Text('Receive text message alerts'),
                  secondary: const Icon(Icons.sms_outlined)),
              ListTile(
                leading: const Icon(Icons.calendar_today_outlined),
                title: const Text('Reminder days before'),
                subtitle: Slider(
                  min: 1,
                  max: 7,
                  divisions: 6,
                  value: _reminderDays.toDouble(),
                  label: '$_reminderDays days',
                  onChanged: (value) =>
                      setState(() => _reminderDays = value.round()),
                ),
                trailing: Text('$_reminderDays days'),
              ),
              const SizedBox(height: 18),
              _SectionTitle(title: 'Display'),
              const SizedBox(height: 8),
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(
                      value: 'light',
                      icon: Icon(Icons.light_mode_outlined),
                      label: Text('Light')),
                  ButtonSegment(
                      value: 'dark',
                      icon: Icon(Icons.dark_mode_outlined),
                      label: Text('Dark')),
                ],
                selected: {_theme},
                onSelectionChanged: (value) {
                  final theme = value.first;
                  setState(() => _theme = theme);
                  widget.onThemeChanged(theme == 'dark');
                },
              ),
              const SizedBox(height: 14),
              DropdownButtonFormField<String>(
                  initialValue: _language,
                  decoration: const InputDecoration(
                      labelText: 'Language',
                      prefixIcon: Icon(Icons.language_outlined)),
                  items: const [
                    DropdownMenuItem(value: 'en', child: Text('English')),
                    DropdownMenuItem(value: 'fr', child: Text('French')),
                    DropdownMenuItem(value: 'es', child: Text('Spanish')),
                    DropdownMenuItem(value: 'pt', child: Text('Portuguese')),
                  ],
                  onChanged: (value) {
                    if (value != null) setState(() => _language = value);
                  }),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                  initialValue: _currency,
                  decoration: const InputDecoration(
                      labelText: 'Currency',
                      prefixIcon: Icon(Icons.payments_outlined)),
                  items: const [
                    DropdownMenuItem(
                        value: 'ZMW', child: Text('Zambian Kwacha (ZMW)')),
                    DropdownMenuItem(
                        value: 'USD', child: Text('US Dollar (USD)')),
                    DropdownMenuItem(value: 'EUR', child: Text('Euro (EUR)')),
                    DropdownMenuItem(
                        value: 'GBP', child: Text('British Pound (GBP)')),
                  ],
                  onChanged: (value) {
                    if (value != null) setState(() => _currency = value);
                  }),
              const SizedBox(height: 18),
              Row(children: [
                Expanded(
                  child: OutlinedButton.icon(
                      onPressed: _saving ? null : _reset,
                      icon: const Icon(Icons.restart_alt),
                      label: const Text('Reset')),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: FilledButton.icon(
                      onPressed: _saving ? null : _save,
                      icon: const Icon(Icons.save_outlined),
                      label: Text(_saving ? 'Saving...' : 'Save')),
                ),
              ]),
              if (snapshot.connectionState == ConnectionState.waiting)
                const Padding(
                    padding: EdgeInsets.only(top: 16),
                    child: LinearProgressIndicator())
            ]),
      );

  Future<Map<String, dynamic>> _load() async {
    final settings = await widget.apiClient.getSettings();
    if (mounted) {
      setState(() {
        _email = _toBool(settings['email_notifications'], fallback: true);
        _sms = _toBool(settings['sms_notifications']);
        _reminderDays = _toInt(settings['reminder_days_before']);
        if (_reminderDays <= 0) _reminderDays = 2;
        _currency = _text(settings['currency'], fallback: 'ZMW');
        _language = _text(settings['language'], fallback: 'en');
        _theme = _text(settings['theme'],
            fallback: widget.isDarkMode ? 'dark' : 'light');
        _autoSaveDrafts = _toBool(settings['auto_save_drafts'], fallback: true);
        _showProfile =
            _toBool(settings['show_profile_to_others'], fallback: true);
        _allowInvites = _toBool(settings['allow_invites'], fallback: true);
        widget.onThemeChanged(_theme == 'dark');
      });
    }
    return settings;
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await widget.apiClient.updateSettings({
        'email_notifications': _email,
        'sms_notifications': _sms,
        'reminder_days_before': _reminderDays,
        'currency': _currency,
        'theme': _theme,
        'language': _language,
        'auto_save_drafts': _autoSaveDrafts,
        'show_profile_to_others': _showProfile,
        'allow_invites': _allowInvites
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Settings saved successfully')));
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Could not save settings.')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _reset() async {
    setState(() {
      _email = true;
      _sms = false;
      _reminderDays = 1;
      _currency = 'ZMW';
      _language = 'en';
      _theme = 'light';
      _autoSaveDrafts = true;
      _showProfile = true;
      _allowInvites = true;
    });
    widget.onThemeChanged(false);
    await _save();
  }
}

class _DepositForm extends StatefulWidget {
  const _DepositForm({required this.apiClient, required this.plans});
  final ApiClient apiClient;
  final List<SavingPlan> plans;
  @override
  State<_DepositForm> createState() => _DepositFormState();
}

class _DepositFormState extends State<_DepositForm> {
  final _formKey = GlobalKey<FormState>();
  final _amount = TextEditingController();
  final _notes = TextEditingController();
  late int _planId = widget.plans.first.id;
  bool _saving = false;
  @override
  void dispose() {
    _amount.dispose();
    _notes.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => _BottomFormShell(
      title: 'Record deposit',
      child: Form(
          key: _formKey,
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            _PlanPicker(
                plans: widget.plans,
                value: _planId,
                onChanged: (id) => setState(() => _planId = id)),
            const SizedBox(height: 12),
            TextFormField(
                controller: _amount,
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(labelText: 'Amount'),
                validator: _positiveNumber),
            const SizedBox(height: 12),
            TextFormField(
                controller: _notes,
                decoration: const InputDecoration(labelText: 'Notes')),
            const SizedBox(height: 16),
            FilledButton.icon(
                onPressed: _saving ? null : _save,
                icon: const Icon(Icons.check),
                label: const Text('Save deposit'))
          ])));
  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await widget.apiClient.createDeposit(
          planId: _planId,
          amount: double.parse(_amount.text.trim()),
          depositDate: DateTime.now(),
          notes: _notes.text.trim());
      if (mounted) Navigator.of(context).pop(true);
    } on ApiException catch (error) {
      if (mounted)
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(error.message)));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }
}

class _WithdrawalForm extends StatefulWidget {
  const _WithdrawalForm({required this.apiClient, required this.plans});
  final ApiClient apiClient;
  final List<SavingPlan> plans;
  @override
  State<_WithdrawalForm> createState() => _WithdrawalFormState();
}

class _WithdrawalFormState extends State<_WithdrawalForm> {
  final _formKey = GlobalKey<FormState>();
  final _amount = TextEditingController();
  final _reason = TextEditingController();
  late int _planId = widget.plans.first.id;
  bool _saving = false;
  @override
  void dispose() {
    _amount.dispose();
    _reason.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => _BottomFormShell(
      title: 'Request withdraw',
      child: Form(
          key: _formKey,
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            _PlanPicker(
                plans: widget.plans,
                value: _planId,
                onChanged: (id) => setState(() => _planId = id)),
            const SizedBox(height: 12),
            TextFormField(
                controller: _amount,
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(labelText: 'Amount'),
                validator: _positiveNumber),
            const SizedBox(height: 12),
            TextFormField(
                controller: _reason,
                decoration: const InputDecoration(labelText: 'Reason'),
                validator: (value) => value == null || value.trim().isEmpty
                    ? 'Enter a reason'
                    : null),
            const SizedBox(height: 16),
            FilledButton.icon(
                onPressed: _saving ? null : _save,
                icon: const Icon(Icons.check),
                label: const Text('Submit request'))
          ])));
  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await widget.apiClient.createWithdrawal(
          planId: _planId,
          amount: double.parse(_amount.text.trim()),
          reason: _reason.text.trim());
      if (mounted) Navigator.of(context).pop(true);
    } on ApiException catch (error) {
      if (mounted)
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(error.message)));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }
}

class _BottomFormShell extends StatelessWidget {
  const _BottomFormShell({required this.title, required this.child});
  final String title;
  final Widget child;
  @override
  Widget build(BuildContext context) => SafeArea(
      child: Padding(
          padding: EdgeInsets.only(
              left: 16,
              right: 16,
              top: 16,
              bottom: MediaQuery.of(context).viewInsets.bottom + 16),
          child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: Theme.of(context)
                        .textTheme
                        .titleLarge
                        ?.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 16),
                child
              ])));
}

class _PlanPicker extends StatelessWidget {
  const _PlanPicker(
      {required this.plans, required this.value, required this.onChanged});
  final List<SavingPlan> plans;
  final int value;
  final ValueChanged<int> onChanged;
  @override
  Widget build(BuildContext context) => DropdownButtonFormField<int>(
      initialValue: value,
      decoration: const InputDecoration(
          labelText: 'Plan', prefixIcon: Icon(Icons.savings_outlined)),
      items: plans
          .map((plan) => DropdownMenuItem(
              value: plan.id,
              child: Text(plan.name, overflow: TextOverflow.ellipsis)))
          .toList(),
      onChanged: (id) {
        if (id != null) onChanged(id);
      });
}

class _QuickActionStrip extends StatelessWidget {
  const _QuickActionStrip({
    required this.onCreatePlan,
    required this.onOpenPlans,
    required this.onDeposits,
    required this.onWithdraws,
  });

  final VoidCallback onCreatePlan;
  final VoidCallback onOpenPlans;
  final VoidCallback onDeposits;
  final VoidCallback onWithdraws;

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Expanded(
          child: _QuickActionButton(
              icon: Icons.add_card_rounded,
              label: 'Plan',
              onTap: onCreatePlan)),
      const SizedBox(width: 10),
      Expanded(
          child: _QuickActionButton(
              icon: Icons.account_balance_rounded,
              label: 'Accounts',
              onTap: onOpenPlans)),
      const SizedBox(width: 10),
      Expanded(
          child: _QuickActionButton(
              icon: Icons.south_west_rounded,
              label: 'Deposit',
              onTap: onDeposits)),
      const SizedBox(width: 10),
      Expanded(
          child: _QuickActionButton(
              icon: Icons.north_east_rounded,
              label: 'Withdraw',
              onTap: onWithdraws)),
    ]);
  }
}

class _QuickActionButton extends StatelessWidget {
  const _QuickActionButton(
      {required this.icon, required this.label, required this.onTap});
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Ink(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: scheme.surface,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: scheme.outlineVariant),
        ),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, color: scheme.primary),
          const SizedBox(height: 6),
          Text(label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.labelMedium),
        ]),
      ),
    );
  }
}

class _SummaryPanel extends StatelessWidget {
  const _SummaryPanel({required this.summary, required this.money});
  final DashboardSummary summary;
  final NumberFormat money;
  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: scheme.primary,
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: scheme.primary.withValues(alpha: 0.20),
            blurRadius: 22,
            offset: const Offset(0, 10),
          )
        ],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Expanded(
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Total balance',
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: scheme.onPrimary.withValues(alpha: 0.78))),
              const SizedBox(height: 8),
              Text(money.format(summary.totalSavings),
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        color: scheme.onPrimary,
                        fontWeight: FontWeight.w900,
                      )),
            ]),
          ),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Text('Target',
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: scheme.onPrimary.withValues(alpha: 0.78))),
            const SizedBox(height: 8),
            Text(money.format(summary.totalTarget),
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: scheme.onPrimary, fontWeight: FontWeight.w800)),
          ]),
        ]),
        const SizedBox(height: 6),
        Text('${summary.progress.toStringAsFixed(0)}% of target reached',
            style: Theme.of(context)
                .textTheme
                .bodySmall
                ?.copyWith(color: scheme.onPrimary.withValues(alpha: 0.82))),
        const SizedBox(height: 16),
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: LinearProgressIndicator(
            minHeight: 8,
            backgroundColor: scheme.onPrimary.withValues(alpha: 0.18),
            color: scheme.primaryContainer,
            value: (summary.progress / 100).clamp(0, 1).toDouble(),
          ),
        ),
        const SizedBox(height: 16),
        Wrap(spacing: 10, runSpacing: 10, children: [
          _Metric(
              label: 'Plans', value: '${summary.totalPlans}', inverted: true),
          _Metric(
              label: 'Active', value: '${summary.activePlans}', inverted: true),
          _Metric(
              label: 'Upcoming',
              value: '${summary.upcomingDeposits}',
              inverted: true),
          _Metric(
              label: 'Pending',
              value: '${summary.pendingWithdrawals}',
              inverted: true),
        ])
      ]),
    );
  }
}

class _PlanTile extends StatelessWidget {
  const _PlanTile(
      {required this.plan,
      required this.money,
      this.onTap,
      this.compact = false});
  final SavingPlan plan;
  final NumberFormat money;
  final VoidCallback? onTap;
  final bool compact;
  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final daysLeft = _daysLeft(plan.endDate);
    final interest = plan.interestRate > 0
        ? '${plan.interestRate.toStringAsFixed(plan.interestRate.truncateToDouble() == plan.interestRate ? 0 : 2)}% interest'
        : 'No interest';
    final contribution = plan.isFixedAmount
        ? 'Fixed ${money.format(plan.fixedAmount)}'
        : 'Variation';
    final withdrawals =
        plan.allowEarlyWithdrawals ? 'Withdraws allowed' : 'No withdraws';
    final approval = plan.autoApproval ? 'Auto approval' : 'Manual approval';
    return Padding(
      padding: EdgeInsets.only(bottom: compact ? 0 : 10),
      child: Card(
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(8),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: scheme.primaryContainer,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(Icons.savings_rounded,
                      color: scheme.onPrimaryContainer),
                ),
                const SizedBox(width: 10),
                Expanded(
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                      Text(plan.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context)
                              .textTheme
                              .titleMedium
                              ?.copyWith(fontWeight: FontWeight.w800)),
                      Text(plan.status.isEmpty ? 'active' : plan.status,
                          style: Theme.of(context).textTheme.labelSmall),
                    ])),
                Icon(Icons.chevron_right_rounded,
                    color: scheme.onSurfaceVariant),
              ]),
              const SizedBox(height: 12),
              if (plan.description.isNotEmpty) ...[
                Text(plan.description,
                    maxLines: compact ? 1 : 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: 4),
              ],
              Text('Target ${money.format(plan.targetAmount)}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context)
                      .textTheme
                      .bodySmall
                      ?.copyWith(fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Text(money.format(plan.totalDeposits),
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w900,
                      )),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                  minHeight: 7,
                  value: plan.progress,
                ),
              ),
              const SizedBox(height: 8),
              if (!compact)
                Wrap(spacing: 8, runSpacing: 6, children: [
                  _MiniChip(icon: Icons.schedule_outlined, label: daysLeft),
                  _MiniChip(icon: Icons.payments_outlined, label: contribution),
                  _MiniChip(icon: Icons.percent_outlined, label: interest),
                  _MiniChip(
                      icon: Icons.account_balance_wallet_outlined,
                      label: withdrawals),
                  _MiniChip(icon: Icons.verified_outlined, label: approval),
                  _MiniChip(
                      icon: Icons.group_outlined,
                      label: '${plan.maxMembers} members'),
                  _MiniChip(icon: Icons.repeat_outlined, label: plan.frequency),
                ])
              else
                Row(children: [
                  Expanded(
                      child: _MiniChip(
                          icon: Icons.payments_outlined, label: contribution)),
                  const SizedBox(width: 6),
                  Expanded(
                      child: _MiniChip(
                          icon: Icons.percent_outlined, label: interest)),
                ]),
            ]),
          ),
        ),
      ),
    );
  }
}

class _MoneyEventTile extends StatelessWidget {
  const _MoneyEventTile(
      {required this.item,
      required this.money,
      required this.fallbackTitle,
      this.onTap});
  final Map<String, dynamic> item;
  final NumberFormat money;
  final String fallbackTitle;
  final VoidCallback? onTap;
  @override
  Widget build(BuildContext context) {
    final plan = _asMap(item['plan']);
    final user = _asMap(item['user']);
    final isDeposit = fallbackTitle == 'Deposit';
    final amount = money.format(_toDouble(item['amount']));
    final dateValue = item['deposit_date'] ??
        item['withdrawal_date'] ??
        item['created_at'] ??
        item['updated_at'];
    final note = _text(item['notes'] ?? item['reason']);
    final status =
        _text(item['status'], fallback: isDeposit ? 'confirmed' : 'pending');
    final subtitle = [
      _text(user['username'], fallback: 'Member'),
      formatSaveWiseDateTime(dateValue),
      status,
      if (note.isNotEmpty) note,
    ].where((part) => part.isNotEmpty).join(' - ');
    return _InfoCard(
        onTap: onTap,
        icon: isDeposit ? Icons.south_west_rounded : Icons.north_east_rounded,
        iconColor:
            isDeposit ? const Color(0xFF2E8F3A) : const Color(0xFF143B82),
        iconBackground:
            isDeposit ? const Color(0xFFEAF7EC) : const Color(0xFFEDEFF7),
        title: _text(plan['plan_name'], fallback: fallbackTitle),
        subtitle: subtitle,
        trailing: Text(isDeposit ? amount : '-$amount',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: isDeposit ? const Color(0xFF198C2E) : null,
                )));
  }
}

class _MiniChip extends StatelessWidget {
  const _MiniChip({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 14),
          const SizedBox(width: 4),
          Flexible(
            child: Text(label,
                maxLines: 1,
                style: Theme.of(context).textTheme.labelSmall,
                overflow: TextOverflow.ellipsis),
          ),
        ]),
      );
}

class _InfoCard extends StatelessWidget {
  const _InfoCard(
      {required this.icon,
      required this.title,
      required this.subtitle,
      this.trailing,
      this.onTap,
      this.iconColor,
      this.iconBackground});
  final IconData icon;
  final String title;
  final String subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;
  final Color? iconColor;
  final Color? iconBackground;
  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Material(
      color: scheme.surface,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: iconBackground ??
                    scheme.primaryContainer.withValues(alpha: 0.45),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: iconColor ?? scheme.primary, size: 28),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Container(
                padding: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  border:
                      Border(bottom: BorderSide(color: scheme.outlineVariant)),
                ),
                child: Row(children: [
                  Expanded(
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context)
                                  .textTheme
                                  .titleMedium
                                  ?.copyWith(fontWeight: FontWeight.w700)),
                          if (subtitle.isNotEmpty) ...[
                            const SizedBox(height: 3),
                            Text(subtitle,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: Theme.of(context)
                                    .textTheme
                                    .bodyMedium
                                    ?.copyWith(
                                      color: scheme.onSurfaceVariant,
                                    )),
                          ],
                        ]),
                  ),
                  if (trailing != null) trailing!,
                ]),
              ),
            ),
          ]),
        ),
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric(
      {required this.label, required this.value, this.inverted = false});
  final String label;
  final String value;
  final bool inverted;
  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final foreground = inverted ? scheme.onPrimary : scheme.onSurface;
    return Container(
      constraints: const BoxConstraints(minWidth: 104),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: inverted
            ? scheme.onPrimary.withValues(alpha: 0.12)
            : scheme.surfaceContainerHighest,
        border: Border.all(
          color: inverted
              ? scheme.onPrimary.withValues(alpha: 0.18)
              : scheme.outlineVariant,
        ),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label,
            style: Theme.of(context)
                .textTheme
                .labelSmall
                ?.copyWith(color: foreground.withValues(alpha: 0.72))),
        const SizedBox(height: 4),
        Text(value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: foreground,
                  fontWeight: FontWeight.w800,
                ))
      ]),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title, this.trailing});
  final String title;
  final String? trailing;
  @override
  Widget build(BuildContext context) => Row(children: [
        Expanded(
            child: Text(title,
                style: Theme.of(context)
                    .textTheme
                    .titleLarge
                    ?.copyWith(fontWeight: FontWeight.w700))),
        if (trailing != null)
          Text(trailing!, style: Theme.of(context).textTheme.labelLarge)
      ]);
}

class _StatusChip extends StatelessWidget {
  const _StatusChip(this.status);
  final String status;

  @override
  Widget build(BuildContext context) {
    final normalized = status.toLowerCase();
    final colors = _statusColors(normalized);
    final label = normalized.isEmpty ? 'pending' : normalized;
    return Chip(
      label: Text(label),
      backgroundColor: colors.$1,
      labelStyle: TextStyle(color: colors.$2, fontWeight: FontWeight.w700),
      side: BorderSide(color: colors.$2.withValues(alpha: 0.18)),
    );
  }
}

(Color, Color) _statusColors(String status) {
  switch (status.toLowerCase()) {
    case 'active':
    case 'accepted':
    case 'approved':
    case 'completed':
    case 'confirmed':
    case 'success':
    case 'deposit':
      return (const Color(0xFFE8F7EE), const Color(0xFF198C2E));
    case 'pending':
    case 'warning':
      return (const Color(0xFFFFF7DF), const Color(0xFFB77900));
    case 'rejected':
    case 'cancelled':
    case 'delete':
    case 'withdraw':
    case 'error':
      return (const Color(0xFFFFECEB), const Color(0xFFB42318));
    default:
      return (const Color(0xFFEAF2FF), const Color(0xFF497FFF));
  }
}

class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader(
      {required this.username, required this.email, this.photoUrl});
  final String username;
  final String email;
  final String? photoUrl;
  @override
  Widget build(BuildContext context) => Row(children: [
        CircleAvatar(
            backgroundColor: Theme.of(context).colorScheme.primaryContainer,
            backgroundImage: photoUrl == null ? null : NetworkImage(photoUrl!),
            child: photoUrl == null
                ? Text(username.isEmpty ? 'S' : username[0].toUpperCase())
                : null),
        const SizedBox(width: 12),
        Expanded(
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Hello, $username',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(fontWeight: FontWeight.w700)),
          Text(email,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodySmall)
        ]))
      ]);
}

class _BadgeIcon extends StatelessWidget {
  const _BadgeIcon({required this.icon, required this.count});
  final IconData icon;
  final int count;
  @override
  Widget build(BuildContext context) => count <= 0
      ? Icon(icon)
      : Badge(label: Text(count > 99 ? '99+' : '$count'), child: Icon(icon));
}

class _EmptyState extends StatelessWidget {
  const _EmptyState(
      {required this.icon,
      required this.title,
      required this.message,
      this.actionLabel,
      this.onAction});
  final IconData icon;
  final String title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;
  @override
  Widget build(BuildContext context) => Card(
      child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(children: [
            Icon(icon, size: 42, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 10),
            Text(title,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 4),
            Text(message, textAlign: TextAlign.center),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 12),
              FilledButton(onPressed: onAction, child: Text(actionLabel!))
            ]
          ])));
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) => Card(
      child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(children: [
            Icon(Icons.cloud_off_outlined,
                size: 38, color: Theme.of(context).colorScheme.error),
            const SizedBox(height: 10),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            OutlinedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: const Text('Try again'))
          ])));
}

String? _positiveNumber(String? value) {
  final number = double.tryParse(value ?? '');
  if (number == null || number <= 0) return 'Enter a positive amount';
  return null;
}

Map<String, dynamic> _asMap(Object? value) =>
    value is Map ? Map<String, dynamic>.from(value) : <String, dynamic>{};
String _text(Object? value, {String fallback = ''}) {
  final text = value?.toString().trim() ?? '';
  final lower = text.toLowerCase();
  return text.isEmpty || lower == 'null' || lower == 'unknown'
      ? fallback
      : text;
}

String _accountAge(Object? value) {
  final created = parseSaveWiseDate(value);
  if (created == null) return 'Unknown';
  final now = DateTime.now();
  var months = (now.year - created.year) * 12 + now.month - created.month;
  if (now.day < created.day) months -= 1;
  if (months < 1) return 'Less than 1 month';
  if (months < 12) return months == 1 ? '1 month' : '$months months';
  final years = months ~/ 12;
  return years == 1 ? '1 year' : '$years years';
}

String? _profileImageUrl(Object? value) {
  final path = _text(value);
  if (path.isEmpty) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  final api = Uri.parse(AppConfig.apiBaseUrl);
  final origin = api.origin;
  return path.startsWith('/') ? '$origin$path' : '$origin/$path';
}

String _daysLeft(Object? value) {
  final end = parseSaveWiseDate(value);
  if (end == null) return 'No end date';
  final today = DateTime.now();
  final current = DateTime(today.year, today.month, today.day);
  final target = DateTime(end.year, end.month, end.day);
  final days = target.difference(current).inDays;
  if (days < 0) return 'Ended';
  if (days == 0) return 'Due today';
  if (days == 1) return '1 day left';
  return '$days days left';
}

int _toInt(Object? value) => value is int
    ? value
    : value is num
        ? value.toInt()
        : int.tryParse(value?.toString() ?? '') ?? 0;
double _toDouble(Object? value) => value is double
    ? value
    : value is num
        ? value.toDouble()
        : double.tryParse(value?.toString() ?? '') ?? 0;
bool _toBool(Object? value, {bool fallback = false}) {
  if (value is bool) return value;
  if (value is num) return value != 0;
  final text = value?.toString().toLowerCase();
  if (text == 'true' || text == '1') return true;
  if (text == 'false' || text == '0') return false;
  return fallback;
}
