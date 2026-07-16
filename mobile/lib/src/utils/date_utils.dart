import 'package:intl/intl.dart';

DateTime? parseSaveWiseDate(Object? value) {
  if (value == null) return null;
  if (value is DateTime) return value.toLocal();
  if (value is num) {
    final milliseconds =
        value > 9999999999 ? value.toInt() : value.toInt() * 1000;
    return DateTime.fromMillisecondsSinceEpoch(milliseconds).toLocal();
  }

  final raw = value.toString().trim();
  final lower = raw.toLowerCase();
  if (raw.isEmpty || lower == 'null' || lower == 'unknown') return null;

  final normalized = raw.contains('T') ? raw : raw.replaceFirst(' ', 'T');
  final parsed = DateTime.tryParse(normalized);
  if (parsed != null) return parsed.toLocal();

  final formats = [
    'yyyy-MM-dd HH:mm:ss.SSS',
    'yyyy-MM-dd HH:mm:ss',
    'yyyy-MM-dd',
    'MM/dd/yyyy',
    'dd/MM/yyyy',
    'MMM d, yyyy',
    'MMM d, yyyy, HH:mm',
  ];
  for (final format in formats) {
    try {
      return DateFormat(format).parseLoose(raw).toLocal();
    } catch (_) {
      // Try the next supported database/display shape.
    }
  }
  return null;
}

String formatSaveWiseDate(Object? value, {String fallback = 'Not set'}) {
  final date = parseSaveWiseDate(value);
  if (date == null) return fallback;
  return DateFormat('MMM d, yyyy').format(date);
}

String formatSaveWiseDateTime(Object? value, {String fallback = 'Not set'}) {
  final date = parseSaveWiseDate(value);
  if (date == null) return fallback;
  return DateFormat('MMM d, yyyy, HH:mm').format(date);
}

String dateOnly(DateTime date) {
  final month = date.month.toString().padLeft(2, '0');
  final day = date.day.toString().padLeft(2, '0');
  return '${date.year}-$month-$day';
}
