import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../models/saving_plan.dart';
import '../utils/date_utils.dart';

class CreatePlanScreen extends StatefulWidget {
  const CreatePlanScreen({super.key, required this.apiClient, this.plan});

  final ApiClient apiClient;
  final SavingPlan? plan;

  @override
  State<CreatePlanScreen> createState() => _CreatePlanScreenState();
}

class _CreatePlanScreenState extends State<CreatePlanScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _targetController;
  late final TextEditingController _fixedController;
  late final TextEditingController _membersController;
  late final TextEditingController _interestController;

  String _frequency = 'monthly';
  DateTime _startDate = DateTime.now();
  DateTime _endDate = DateTime.now().add(const Duration(days: 90));
  bool _isFixedAmount = true;
  bool _isSaving = false;
  String? _error;

  bool get _isEditing => widget.plan != null;

  @override
  void initState() {
    super.initState();
    final plan = widget.plan;
    _nameController = TextEditingController(text: plan?.name ?? '');
    _descriptionController =
        TextEditingController(text: plan?.description ?? '');
    _targetController = TextEditingController(
        text: plan == null || plan.targetAmount == 0
            ? ''
            : _num(plan.targetAmount));
    _fixedController = TextEditingController(
        text: plan == null || plan.fixedAmount == 0
            ? ''
            : _num(plan.fixedAmount));
    _membersController = TextEditingController(
        text:
            plan == null || plan.maxMembers == 0 ? '1' : '${plan.maxMembers}');
    _interestController = TextEditingController(
        text: plan == null || plan.interestRate == 0
            ? '0'
            : _num(plan.interestRate));
    _frequency =
        plan?.frequency.isNotEmpty == true ? plan!.frequency : 'monthly';
    _isFixedAmount = plan?.isFixedAmount ?? true;
    _startDate = parseSaveWiseDate(plan?.startDate) ?? DateTime.now();
    _endDate = parseSaveWiseDate(plan?.endDate) ??
        DateTime.now().add(const Duration(days: 90));
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _targetController.dispose();
    _fixedController.dispose();
    _membersController.dispose();
    _interestController.dispose();
    super.dispose();
  }

  String get _cycleLabel {
    if (!_endDate.isAfter(_startDate)) return 'Select valid dates';
    final wholeMonths = ((_endDate.year - _startDate.year) * 12) +
        _endDate.month -
        _startDate.month;
    final anchor = DateTime(
        _startDate.year, _startDate.month + wholeMonths, _startDate.day);
    final months =
        (wholeMonths + (anchor.isBefore(_endDate) ? 1 : 0)).clamp(1, 999);
    return '$months ${months == 1 ? 'month' : 'months'}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_isEditing ? 'Edit plan' : 'Create plan')),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
            children: [
              _FormHeader(isEditing: _isEditing),
              const SizedBox(height: 16),
              TextFormField(
                controller: _nameController,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(
                  labelText: 'Plan name',
                  prefixIcon: Icon(Icons.drive_file_rename_outline),
                ),
                validator: (value) => (value == null || value.trim().length < 3)
                    ? 'Use at least 3 characters'
                    : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _descriptionController,
                minLines: 2,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Description',
                  prefixIcon: Icon(Icons.notes_outlined),
                ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: _frequency,
                decoration: const InputDecoration(
                  labelText: 'Contribution frequency',
                  prefixIcon: Icon(Icons.event_repeat_outlined),
                ),
                items: const [
                  DropdownMenuItem(value: 'weekly', child: Text('Weekly')),
                  DropdownMenuItem(
                      value: 'bi-weekly', child: Text('Bi-weekly')),
                  DropdownMenuItem(value: 'monthly', child: Text('Monthly')),
                ],
                onChanged: (value) =>
                    setState(() => _frequency = value ?? _frequency),
              ),
              const SizedBox(height: 12),
              SegmentedButton<bool>(
                segments: const [
                  ButtonSegment(
                      value: true,
                      icon: Icon(Icons.lock_outline),
                      label: Text('Fixed amount')),
                  ButtonSegment(
                      value: false,
                      icon: Icon(Icons.tune_outlined),
                      label: Text('Variable amount')),
                ],
                selected: {_isFixedAmount},
                onSelectionChanged: (value) =>
                    setState(() => _isFixedAmount = value.first),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _targetController,
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: 'Target amount',
                  prefixIcon: Icon(Icons.flag_outlined),
                ),
                validator: _positiveNumber,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _fixedController,
                enabled: _isFixedAmount,
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                decoration: InputDecoration(
                  labelText: _isFixedAmount
                      ? 'Fixed amount per deposit'
                      : 'Fixed amount disabled',
                  prefixIcon: const Icon(Icons.payments_outlined),
                ),
                validator: _isFixedAmount ? _positiveNumber : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _interestController,
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: 'Interest rate (%)',
                  prefixIcon: Icon(Icons.percent_outlined),
                ),
                validator: _nonNegativeNumber,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _membersController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Maximum members',
                  prefixIcon: Icon(Icons.group_outlined),
                ),
                validator: (value) {
                  final number = int.tryParse(value ?? '');
                  if (number == null || number < 1) return 'At least 1 member';
                  return null;
                },
              ),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _pickStartDate,
                    icon: const Icon(Icons.today_outlined),
                    label: Text(formatSaveWiseDate(_startDate)),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _pickEndDate,
                    icon: const Icon(Icons.event_outlined),
                    label: Text(formatSaveWiseDate(_endDate)),
                  ),
                ),
              ]),
              const SizedBox(height: 12),
              InputDecorator(
                decoration: const InputDecoration(
                  labelText: 'Cycle',
                  prefixIcon: Icon(Icons.calendar_month_outlined),
                ),
                child: Text(_cycleLabel),
              ),
              if (_error != null) ...[
                const SizedBox(height: 14),
                Text(_error!,
                    style:
                        TextStyle(color: Theme.of(context).colorScheme.error)),
              ],
              const SizedBox(height: 18),
              FilledButton.icon(
                onPressed: _isSaving ? null : _save,
                icon: _isSaving
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.check),
                label: Text(_isEditing ? 'Save changes' : 'Create plan'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _pickStartDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _startDate,
      firstDate: DateTime(2020),
      lastDate: DateTime(2100),
    );
    if (picked != null) {
      setState(() {
        _startDate = picked;
        if (!_endDate.isAfter(_startDate)) {
          _endDate = _startDate.add(const Duration(days: 90));
        }
      });
    }
  }

  Future<void> _pickEndDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _endDate.isAfter(_startDate)
          ? _endDate
          : _startDate.add(const Duration(days: 90)),
      firstDate: _startDate.add(const Duration(days: 1)),
      lastDate: DateTime(2100),
    );
    if (picked != null) setState(() => _endDate = picked);
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (!_endDate.isAfter(_startDate)) {
      setState(() => _error = 'End date must be after start date.');
      return;
    }

    setState(() {
      _isSaving = true;
      _error = null;
    });

    try {
      final fixedAmount =
          _isFixedAmount ? double.parse(_fixedController.text.trim()) : 0.0;
      if (_isEditing) {
        await widget.apiClient.updatePlan(
          id: widget.plan!.id,
          name: _nameController.text.trim(),
          description: _descriptionController.text.trim(),
          frequency: _frequency,
          targetAmount: double.parse(_targetController.text.trim()),
          fixedAmount: fixedAmount,
          maxMembers: int.parse(_membersController.text.trim()),
          startDate: _startDate,
          endDate: _endDate,
          isFixedAmount: _isFixedAmount,
          interestRate: double.parse(_interestController.text.trim()),
        );
      } else {
        await widget.apiClient.createPlan(
          name: _nameController.text.trim(),
          description: _descriptionController.text.trim(),
          frequency: _frequency,
          targetAmount: double.parse(_targetController.text.trim()),
          fixedAmount: fixedAmount,
          maxMembers: int.parse(_membersController.text.trim()),
          startDate: _startDate,
          endDate: _endDate,
          isFixedAmount: _isFixedAmount,
          interestRate: double.parse(_interestController.text.trim()),
        );
      }
      if (mounted) Navigator.of(context).pop(true);
    } on ApiException catch (error) {
      setState(() => _error = error.message);
    } catch (_) {
      setState(() =>
          _error = 'Could not save the plan. Check the backend connection.');
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  String? _positiveNumber(String? value) {
    final number = double.tryParse(value ?? '');
    if (number == null || number <= 0) return 'Enter a positive amount';
    return null;
  }

  String? _nonNegativeNumber(String? value) {
    final number = double.tryParse(value ?? '');
    if (number == null || number < 0) return 'Enter zero or more';
    return null;
  }

  String _num(double value) =>
      value.toStringAsFixed(value.truncateToDouble() == value ? 0 : 2);
}

class _FormHeader extends StatelessWidget {
  const _FormHeader({required this.isEditing});
  final bool isEditing;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: scheme.primary,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(children: [
        Icon(isEditing ? Icons.edit_note : Icons.add_card_rounded,
            color: scheme.onPrimary),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            isEditing ? 'Update plan settings' : 'Build a new SaveWise plan',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: scheme.onPrimary,
                  fontWeight: FontWeight.w800,
                ),
          ),
        ),
      ]),
    );
  }
}
