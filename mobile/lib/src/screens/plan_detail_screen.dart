import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../api/api_client.dart';
import '../models/saving_plan.dart';
import '../utils/date_utils.dart';
import 'create_plan_screen.dart';

class PlanDetailScreen extends StatefulWidget {
  const PlanDetailScreen(
      {super.key, required this.apiClient, required this.planId});

  final ApiClient apiClient;
  final int planId;

  @override
  State<PlanDetailScreen> createState() => _PlanDetailScreenState();
}

class _PlanDetailScreenState extends State<PlanDetailScreen> {
  final _money = NumberFormat.currency(symbol: 'ZMW ', decimalDigits: 2);
  late Future<_PlanDetailData> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Plan details'),
        actions: [
          IconButton(
              tooltip: 'Plan chat',
              onPressed: _openChat,
              icon: const Icon(Icons.forum_outlined)),
          FutureBuilder<_PlanDetailData>(
            future: _future,
            builder: (context, snapshot) {
              final canManage = _canManagePlan(snapshot.data?.plan);
              if (!canManage) return const SizedBox.shrink();
              return Row(mainAxisSize: MainAxisSize.min, children: [
                IconButton(
                    tooltip: 'Invite member',
                    onPressed: _inviteMember,
                    icon: const Icon(Icons.person_add_alt_1_outlined)),
                PopupMenuButton<String>(
                  onSelected: _handleMenu,
                  itemBuilder: (context) => const [
                    PopupMenuItem(value: 'edit', child: Text('Edit plan')),
                    PopupMenuItem(
                        value: 'settings', child: Text('Plan settings')),
                    PopupMenuItem(value: 'delete', child: Text('Delete plan')),
                  ],
                ),
              ]);
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: FutureBuilder<_PlanDetailData>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasError) {
              return ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _ErrorCard(
                      message: _errorText(snapshot.error), onRetry: _refresh)
                ],
              );
            }
            final data = snapshot.data!;
            final canManage = _canManagePlan(data.plan);
            return ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
              children: [
                _PlanHeader(plan: data.plan, money: _money),
                const SizedBox(height: 12),
                FilledButton.icon(
                  onPressed: _openChat,
                  icon: const Icon(Icons.forum_outlined),
                  label: const Text('Open plan chat'),
                ),
                if (canManage) ...[
                  const SizedBox(height: 16),
                  FilledButton.icon(
                    onPressed: _inviteMember,
                    icon: const Icon(Icons.person_add_alt_1_outlined),
                    label: const Text('Invite member'),
                  ),
                ],
                const SizedBox(height: 16),
                _DetailSection(plan: data.plan, money: _money),
                const SizedBox(height: 16),
                _MembersSection(members: data.members),
                const SizedBox(height: 16),
                _InvitationsSection(invitations: data.invitations),
                const SizedBox(height: 16),
                _MoneySection(
                    title: 'Deposits',
                    empty: 'No deposits recorded for this plan.',
                    items: data.deposits,
                    money: _money,
                    isDeposit: true),
                const SizedBox(height: 16),
                _MoneySection(
                    title: 'Withdraws',
                    empty: 'No withdraw requests for this plan.',
                    items: data.withdrawals,
                    money: _money,
                    isDeposit: false),
              ],
            );
          },
        ),
      ),
    );
  }

  Future<_PlanDetailData> _load() async {
    final results = await Future.wait([
      widget.apiClient.getPlanDetails(widget.planId),
      widget.apiClient.getPlanDeposits(widget.planId),
      widget.apiClient.getPlanWithdrawals(widget.planId),
      widget.apiClient
          .getPendingPlanInvitations(widget.planId)
          .catchError((_) => <Map<String, dynamic>>[]),
    ]);
    final plan = Map<String, dynamic>.from(results[0] as Map);
    return _PlanDetailData(
      plan: plan,
      members: _list(plan['members']),
      deposits: results[1] as List<Map<String, dynamic>>,
      withdrawals: results[2] as List<Map<String, dynamic>>,
      invitations: results[3] as List<Map<String, dynamic>>,
    );
  }

  Future<void> _refresh() async {
    final next = _load();
    setState(() {
      _future = next;
    });
    await next;
  }

  Future<void> _openChat() async {
    await Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => _PlanChatScreen(
        apiClient: widget.apiClient,
        planId: widget.planId,
      ),
    ));
  }

  Future<void> _handleMenu(String value) async {
    final data = await _future;
    if (!mounted) return;
    final plan = SavingPlan.fromJson(data.plan);
    if (value == 'edit') {
      final changed = await Navigator.of(context).push<bool>(MaterialPageRoute(
          builder: (_) =>
              CreatePlanScreen(apiClient: widget.apiClient, plan: plan)));
      if (changed == true) await _refresh();
    } else if (value == 'settings') {
      await _openSettings(data.plan);
    } else if (value == 'delete') {
      await _deletePlan(plan);
    }
  }

  Future<void> _inviteMember() async {
    final email = TextEditingController();
    final name = TextEditingController();
    final search = TextEditingController();
    var mode = 'existing';
    var searching = false;
    var users = <Map<String, dynamic>>[];
    int? selectedUserId;

    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (context) => StatefulBuilder(
        builder: (context, setSheetState) => SafeArea(
          child: Padding(
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              top: 16,
              bottom: MediaQuery.of(context).viewInsets.bottom + 16,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Invite member',
                      style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 12),
                  SegmentedButton<String>(
                    segments: const [
                      ButtonSegment(
                          value: 'existing',
                          icon: Icon(Icons.person_search_outlined),
                          label: Text('Existing')),
                      ButtonSegment(
                          value: 'email',
                          icon: Icon(Icons.email_outlined),
                          label: Text('Email')),
                      ButtonSegment(
                          value: 'whatsapp',
                          icon: Icon(Icons.chat_outlined),
                          label: Text('WhatsApp')),
                    ],
                    selected: {mode},
                    onSelectionChanged: (value) =>
                        setSheetState(() => mode = value.first),
                  ),
                  const SizedBox(height: 14),
                  if (mode == 'existing') ...[
                    TextField(
                      controller: search,
                      decoration: InputDecoration(
                        labelText: 'Search name or email',
                        prefixIcon: const Icon(Icons.search),
                        suffixIcon: IconButton(
                          tooltip: 'Search users',
                          icon: searching
                              ? const SizedBox(
                                  height: 18,
                                  width: 18,
                                  child:
                                      CircularProgressIndicator(strokeWidth: 2))
                              : const Icon(Icons.arrow_forward),
                          onPressed: searching
                              ? null
                              : () async {
                                  setSheetState(() => searching = true);
                                  try {
                                    final result = await widget.apiClient
                                        .searchUsersToInvite(search.text);
                                    setSheetState(() {
                                      users = result;
                                      selectedUserId = null;
                                    });
                                  } on ApiException catch (error) {
                                    if (context.mounted) {
                                      ScaffoldMessenger.of(context)
                                          .showSnackBar(SnackBar(
                                              content: Text(error.message)));
                                    }
                                  } finally {
                                    setSheetState(() => searching = false);
                                  }
                                },
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (users.isEmpty)
                      const _EmptyText('Search for an existing SaveWise user.')
                    else
                      ...users.map((user) {
                        final id = _toInt(user['id']);
                        return ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: Icon(
                            selectedUserId == id
                                ? Icons.radio_button_checked
                                : Icons.radio_button_unchecked,
                            color: selectedUserId == id
                                ? Theme.of(context).colorScheme.primary
                                : null,
                          ),
                          title:
                              Text(_text(user['username'], fallback: 'User')),
                          subtitle: Text(_text(user['email'])),
                          onTap: () => setSheetState(() => selectedUserId = id),
                        );
                      }),
                  ] else ...[
                    TextField(
                      controller: email,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(
                        labelText: 'Email address',
                        prefixIcon: Icon(Icons.email_outlined),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: name,
                      decoration: const InputDecoration(
                        labelText: 'Invitee name',
                        prefixIcon: Icon(Icons.person_outline),
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  FilledButton.icon(
                    onPressed: () => Navigator.of(context).pop(true),
                    icon: Icon(mode == 'whatsapp'
                        ? Icons.content_copy_outlined
                        : Icons.send_outlined),
                    label: Text(mode == 'whatsapp'
                        ? 'Create WhatsApp link'
                        : 'Send invite'),
                  )
                ],
              ),
            ),
          ),
        ),
      ),
    );
    if (ok != true) return;
    try {
      if (mode == 'existing') {
        if (selectedUserId == null || selectedUserId! <= 0) return;
        await widget.apiClient
            .sendInvitation(planId: widget.planId, userId: selectedUserId);
        if (mounted) {
          ScaffoldMessenger.of(context)
              .showSnackBar(const SnackBar(content: Text('Invitation sent')));
        }
      } else {
        if (email.text.trim().isEmpty) return;
        final data = await widget.apiClient.inviteExternal(
            planId: widget.planId,
            email: email.text.trim(),
            name: name.text.trim());
        final link = _invitationLink(data);
        if (mode == 'whatsapp' && link.isNotEmpty) {
          await Clipboard.setData(ClipboardData(
              text: 'Join my SaveWise plan using this link: $link'));
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                content: Text('WhatsApp invitation link copied')));
          }
        } else if (mounted) {
          ScaffoldMessenger.of(context)
              .showSnackBar(const SnackBar(content: Text('Invitation sent')));
        }
      }
      await _refresh();
    } on ApiException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(error.message)));
      }
    }
  }

  Future<void> _shareInvitationOnWhatsApp(String link) async {
    final message = Uri.encodeComponent('Join my SaveWise plan using this link: $link');
    final appUrl = Uri.parse('whatsapp://send?text=$message');
    final webUrl = Uri.parse('https://wa.me/?text=$message');

    if (await canLaunchUrl(appUrl)) {
      await launchUrl(appUrl, mode: LaunchMode.externalApplication);
    } else {
      await launchUrl(webUrl, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _openSettings(Map<String, dynamic> plan) async {
    final interest = TextEditingController(
        text: _toDouble(plan['interest_rate']).toStringAsFixed(2));
    final multiplier = TextEditingController(
        text: _toDouble(plan['withdrawal_multiplier']).toStringAsFixed(2));
    var status = _text(plan['status'], fallback: 'active');
    var allowWithdraws = _toBool(plan['allow_early_withdrawals']);
    var autoApproval = _toBool(plan['auto_approval'], fallback: true);
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (context) => StatefulBuilder(
        builder: (context, setSheetState) => SafeArea(
          child: Padding(
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              top: 16,
              bottom: MediaQuery.of(context).viewInsets.bottom + 16,
            ),
            child: SingleChildScrollView(
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                Text('Plan settings',
                    style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: ['active', 'completed', 'cancelled', 'pending']
                          .contains(status)
                      ? status
                      : 'active',
                  decoration: const InputDecoration(
                    labelText: 'Status',
                    prefixIcon: Icon(Icons.toggle_on_outlined),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'active', child: Text('Active')),
                    DropdownMenuItem(
                        value: 'completed', child: Text('Completed')),
                    DropdownMenuItem(
                        value: 'cancelled', child: Text('Cancelled')),
                    DropdownMenuItem(value: 'pending', child: Text('Pending')),
                  ],
                  onChanged: (value) {
                    if (value != null) setSheetState(() => status = value);
                  },
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: interest,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(
                    labelText: 'Interest rate (%)',
                    prefixIcon: Icon(Icons.percent_outlined),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: multiplier,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(
                    labelText: 'Withdrawal multiplier',
                    prefixIcon: Icon(Icons.calculate_outlined),
                  ),
                ),
                const SizedBox(height: 8),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value: allowWithdraws,
                  onChanged: (value) =>
                      setSheetState(() => allowWithdraws = value),
                  title: const Text('Allow withdraws'),
                  subtitle: const Text('Members can request plan withdrawals'),
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value: autoApproval,
                  onChanged: (value) =>
                      setSheetState(() => autoApproval = value),
                  title: const Text('Auto approval'),
                  subtitle: const Text('Approve deposits automatically'),
                ),
                const SizedBox(height: 16),
                FilledButton.icon(
                  onPressed: () => Navigator.of(context).pop(true),
                  icon: const Icon(Icons.save_outlined),
                  label: const Text('Save settings'),
                ),
              ]),
            ),
          ),
        ),
      ),
    );
    if (ok != true) return;
    await widget.apiClient.updatePlanSettings(widget.planId, {
      'status': status,
      'interest_rate': double.tryParse(interest.text.trim()) ?? 0,
      'withdrawal_multiplier': double.tryParse(multiplier.text.trim()) ?? 1,
      'allow_early_withdrawals': allowWithdraws,
      'auto_approval': autoApproval,
    });
    await _refresh();
  }

  Future<void> _deletePlan(SavingPlan plan) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete plan?'),
        content: Text('This will delete ${plan.name}.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Cancel')),
          FilledButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: const Text('Delete')),
        ],
      ),
    );
    if (ok != true) return;
    await widget.apiClient.deletePlan(plan.id);
    if (mounted) Navigator.of(context).pop(true);
  }

  String _errorText(Object? error) {
    if (error is ApiException) return error.message;
    return 'Could not load plan details.';
  }
}

class _PlanDetailData {
  const _PlanDetailData(
      {required this.plan,
      required this.members,
      required this.deposits,
      required this.withdrawals,
      required this.invitations});

  final Map<String, dynamic> plan;
  final List<Map<String, dynamic>> members;
  final List<Map<String, dynamic>> deposits;
  final List<Map<String, dynamic>> withdrawals;
  final List<Map<String, dynamic>> invitations;
}

class _PlanHeader extends StatelessWidget {
  const _PlanHeader({required this.plan, required this.money});

  final Map<String, dynamic> plan;
  final NumberFormat money;

  @override
  Widget build(BuildContext context) {
    final savingPlan = SavingPlan.fromJson(plan);
    final scheme = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(
        color: scheme.primary,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                    child: Text(savingPlan.name,
                        style: Theme.of(context)
                            .textTheme
                            .headlineSmall
                            ?.copyWith(
                                fontWeight: FontWeight.w800,
                                color: scheme.onPrimary))),
                _StatusChip(
                    savingPlan.status.isEmpty ? 'active' : savingPlan.status),
              ],
            ),
            if (_text(plan['description']).isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(_text(plan['description']),
                  style: TextStyle(
                      color: scheme.onPrimary.withValues(alpha: 0.82))),
            ],
            const SizedBox(height: 12),
            LinearProgressIndicator(
                backgroundColor: scheme.onPrimary.withValues(alpha: 0.18),
                color: scheme.primaryContainer,
                value: savingPlan.progress),
            const SizedBox(height: 8),
            Text(
              '${money.format(savingPlan.totalDeposits)} saved of ${money.format(savingPlan.targetAmount)}',
              style: TextStyle(color: scheme.onPrimary.withValues(alpha: 0.86)),
            ),
          ],
        ),
      ),
    );
  }
}

class _DetailSection extends StatelessWidget {
  const _DetailSection({required this.plan, required this.money});

  final Map<String, dynamic> plan;
  final NumberFormat money;

  @override
  Widget build(BuildContext context) {
    return _SectionCard(
      title: 'Details',
      children: [
        _InfoRow(
            label: 'Frequency',
            value: _text(plan['frequency'], fallback: 'Not set')),
        _InfoRow(
            label: 'Cycle', value: _text(plan['cycle'], fallback: 'Not set')),
        _InfoRow(
            label: 'Start date', value: formatSaveWiseDate(plan['start_date'])),
        _InfoRow(
            label: 'End date', value: formatSaveWiseDate(plan['end_date'])),
        _InfoRow(
            label: 'Target',
            value: money.format(_toDouble(plan['target_amount']))),
        _InfoRow(
            label: 'Contribution',
            value: _toBool(plan['is_fixed_amount'], fallback: true)
                ? money.format(_toDouble(plan['fixed_amount']))
                : 'Variable amount'),
        _InfoRow(
            label: 'Interest rate',
            value: '${_toDouble(plan['interest_rate']).toStringAsFixed(2)}%'),
        _InfoRow(
            label: 'Withdrawal multiplier',
            value:
                '${_toDouble(plan['withdrawal_multiplier']).toStringAsFixed(2)}x'),
        _InfoRow(
            label: 'Allow withdraws',
            value: _toBool(plan['allow_early_withdrawals']) ? 'Yes' : 'No'),
        _InfoRow(
            label: 'Auto approval',
            value:
                _toBool(plan['auto_approval'], fallback: true) ? 'Yes' : 'No'),
        _InfoRow(
            label: 'Max members',
            value: _text(plan['max_members'], fallback: 'Not set')),
        _InfoRow(label: 'Role', value: _text(plan['role'], fallback: 'member')),
      ],
    );
  }
}

class _PlanChatScreen extends StatefulWidget {
  const _PlanChatScreen({required this.apiClient, required this.planId});

  final ApiClient apiClient;
  final int planId;

  @override
  State<_PlanChatScreen> createState() => _PlanChatScreenState();
}

class _PlanChatScreenState extends State<_PlanChatScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  List<Map<String, dynamic>> _messages = [];
  bool _loading = true;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _load();
    _timer = Timer.periodic(const Duration(seconds: 6), (_) => _load(silent: true));
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _load({bool silent = false}) async {
    try {
      if (!silent) setState(() => _loading = true);
      final messages = await widget.apiClient.getPlanMessages(widget.planId);
      if (!mounted) return;
      setState(() => _messages = messages);
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scrollController.hasClients) {
          _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
        }
      });
    } on ApiException catch (error) {
      if (mounted && !silent) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
      }
    } finally {
      if (mounted && !silent) setState(() => _loading = false);
    }
  }

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    try {
      final message = await widget.apiClient.sendPlanMessage(
        planId: widget.planId,
        message: text,
      );
      if (!mounted) return;
      setState(() {
        _messages = [..._messages, message];
        _controller.clear();
      });
    } on ApiException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Plan group chat'),
        actions: [IconButton(onPressed: _load, icon: const Icon(Icons.refresh))],
      ),
      body: Column(
        children: [
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _messages.isEmpty
                    ? const Center(child: Text('No messages yet. Start the conversation.'))
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.all(16),
                        itemCount: _messages.length,
                        itemBuilder: (context, index) {
                          final message = _messages[index];
                          final user = _map(message['user']);
                          return Align(
                            alignment: Alignment.centerLeft,
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 10),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(14),
                                boxShadow: const [BoxShadow(color: Color(0x11000000), blurRadius: 8)],
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '${_text(user['username'], fallback: 'Member')} - ${formatSaveWiseDateTime(message['created_at'])}',
                                    style: Theme.of(context).textTheme.bodySmall,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(_text(message['message'])),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      minLines: 1,
                      maxLines: 4,
                      decoration: const InputDecoration(hintText: 'Message plan members...'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  FilledButton(
                    onPressed: _send,
                    child: const Icon(Icons.send_outlined),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MembersSection extends StatelessWidget {
  const _MembersSection({required this.members});

  final List<Map<String, dynamic>> members;

  @override
  Widget build(BuildContext context) {
    return _SectionCard(
      title: 'Members',
      children: members.isEmpty
          ? const [_EmptyText('No members found for this plan.')]
          : members.map((member) {
              final user = _map(member['user']);
              return ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const CircleAvatar(child: Icon(Icons.person_outline)),
                title: Text(_text(user['username'], fallback: 'Member')),
                subtitle: Text(
                    '${_text(user['email'], fallback: 'No email')} - ${_text(member['status'], fallback: 'active')}'),
                trailing: member['is_admin'] == true || member['is_admin'] == 1
                    ? const _StatusChip('admin')
                    : null,
              );
            }).toList(),
    );
  }
}

class _InvitationsSection extends StatelessWidget {
  const _InvitationsSection({required this.invitations});

  final List<Map<String, dynamic>> invitations;

  @override
  Widget build(BuildContext context) {
    return _SectionCard(
      title: 'Invitation status',
      children: invitations.isEmpty
          ? const [_EmptyText('No pending invitations for this plan.')]
          : invitations.map((invitation) {
              final status = _text(invitation['status'], fallback: 'pending');
              final inviter =
                  _map(invitation['inviter'] ?? invitation['invitedBy']);
              final invitee = _text(
                  invitation['user_email'] ??
                      invitation['email'] ??
                      invitation['invitee_email'],
                  fallback: 'Invitee');
              final inviterName = _text(invitation['invited_by'],
                  fallback: _text(inviter['username'], fallback: 'SaveWise'));
              final inviteDate = formatSaveWiseDateTime(
                  invitation['created_at'] ??
                      invitation['invited_at'] ??
                      invitation['updated_at']);
              return ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const CircleAvatar(
                    child: Icon(Icons.mark_email_unread_outlined)),
                title: Text(invitee),
                subtitle: Text('$inviterName - $inviteDate'),
                trailing: _StatusChip(status),
              );
            }).toList(),
    );
  }
}

class _MoneySection extends StatelessWidget {
  const _MoneySection(
      {required this.title,
      required this.empty,
      required this.items,
      required this.money,
      required this.isDeposit});

  final String title;
  final String empty;
  final List<Map<String, dynamic>> items;
  final NumberFormat money;
  final bool isDeposit;

  @override
  Widget build(BuildContext context) {
    return _SectionCard(
      title: title,
      children: items.isEmpty
          ? [_EmptyText(empty)]
          : items.map((item) {
              final user = _map(item['user']);
              final date =
                  isDeposit ? item['deposit_date'] : item['created_at'];
              return ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Icon(isDeposit
                    ? Icons.payments_outlined
                    : Icons.account_balance_wallet_outlined),
                title: Text(money.format(_toDouble(item['amount']))),
                subtitle: Text(
                    '${_text(user['username'], fallback: 'Member')} - ${formatSaveWiseDate(date)}'),
                trailing:
                    _StatusChip(_text(item['status'], fallback: 'pending')),
              );
            }).toList(),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title,
                style: Theme.of(context)
                    .textTheme
                    .titleLarge
                    ?.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            ...children,
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Expanded(
              child: Text(label, style: Theme.of(context).textTheme.bodySmall)),
          Flexible(
              child: Text(value,
                  textAlign: TextAlign.end,
                  style: const TextStyle(fontWeight: FontWeight.w700))),
        ],
      ),
    );
  }
}

bool _canManagePlan(Map<String, dynamic>? plan) {
  if (plan == null) return false;
  final role = _text(plan['role']).toLowerCase();
  return role == 'owner' ||
      role == 'admin' ||
      _toBool(plan['is_admin']) ||
      _toBool(plan['can_manage']) ||
      _toBool(plan['canManage']);
}

class _StatusChip extends StatelessWidget {
  const _StatusChip(this.status);
  final String status;

  @override
  Widget build(BuildContext context) {
    final normalized = status.toLowerCase();
    final colors = _statusColors(normalized);
    final label = normalized == 'active'
        ? 'active'
        : normalized == 'completed'
            ? 'completed'
            : normalized == 'cancelled'
                ? 'cancelled'
                : normalized.isEmpty
                    ? 'pending'
                    : normalized;
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
    case 'success':
    case 'deposit':
    case 'admin':
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

class _EmptyText extends StatelessWidget {
  const _EmptyText(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Text(text, style: Theme.of(context).textTheme.bodyMedium),
    );
  }
}

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          children: [
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            OutlinedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: const Text('Try again')),
          ],
        ),
      ),
    );
  }
}

List<Map<String, dynamic>> _list(Object? value) {
  if (value is! List) return const [];
  return value
      .whereType<Map>()
      .map((item) => Map<String, dynamic>.from(item))
      .toList();
}

Map<String, dynamic> _map(Object? value) {
  if (value is Map) return Map<String, dynamic>.from(value);
  return <String, dynamic>{};
}

String _text(Object? value, {String fallback = ''}) {
  final text = value?.toString() ?? '';
  if (text.isEmpty ||
      text.toLowerCase() == 'null' ||
      text.toLowerCase() == 'unknown') {
    return fallback;
  }
  return text;
}

double _toDouble(Object? value) {
  if (value is double) return value;
  if (value is num) return value.toDouble();
  return double.tryParse(value?.toString() ?? '') ?? 0;
}

int _toInt(Object? value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(value?.toString() ?? '') ?? 0;
}

bool _toBool(Object? value, {bool fallback = false}) {
  if (value is bool) return value;
  if (value is num) return value != 0;
  final text = value?.toString().toLowerCase();
  if (text == 'true' || text == '1') return true;
  if (text == 'false' || text == '0') return false;
  return fallback;
}

String _invitationLink(Map<String, dynamic> data) {
  final nested = _map(data['data']);
  final direct = _text(data['invitation_link'] ?? data['link'] ?? data['url']);
  if (direct.isNotEmpty) return direct;
  return _text(nested['invitation_link'] ?? nested['link'] ?? nested['url']);
}
