import 'package:flutter_test/flutter_test.dart';
import 'package:savewise/src/savewise_app.dart';

void main() {
  testWidgets('SaveWise app startup test', (WidgetTester tester) async {
    await tester.pumpWidget(const SaveWiseApp());
  });
}
