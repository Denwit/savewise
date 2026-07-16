import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

enum LegalDocument { terms, privacy }

class LegalScreen extends StatelessWidget {
  const LegalScreen({super.key, required this.document});

  final LegalDocument document;

  @override
  Widget build(BuildContext context) {
    final isTerms = document == LegalDocument.terms;
    final updated = DateFormat('MMMM d, yyyy').format(DateTime.now());
    return Scaffold(
      appBar: AppBar(title: Text(isTerms ? 'Terms of Service' : 'Privacy Policy')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          _LegalHero(
            icon: isTerms ? Icons.gavel_outlined : Icons.lock_outline,
            title: isTerms ? 'Terms and Conditions' : 'Privacy Policy',
            subtitle: isTerms ? 'Last updated: $updated' : 'Effective date: $updated',
          ),
          const SizedBox(height: 16),
          ...(isTerms ? _termsSections : _privacySections).map(
            (section) => _LegalSection(section: section),
          ),
        ],
      ),
    );
  }
}

class _LegalHero extends StatelessWidget {
  const _LegalHero({required this.icon, required this.title, required this.subtitle});
  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(children: [
          CircleAvatar(
            radius: 30,
            backgroundColor: scheme.primaryContainer,
            child: Icon(icon, color: scheme.onPrimaryContainer, size: 30),
          ),
          const SizedBox(height: 14),
          Text(title,
              textAlign: TextAlign.center,
              style: Theme.of(context)
                  .textTheme
                  .headlineSmall
                  ?.copyWith(fontWeight: FontWeight.w900)),
          const SizedBox(height: 6),
          Text(subtitle,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall),
        ]),
      ),
    );
  }
}

class _LegalSection extends StatelessWidget {
  const _LegalSection({required this.section});
  final _SectionData section;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(section.icon, color: Theme.of(context).colorScheme.primary),
            const SizedBox(width: 10),
            Expanded(
              child: Text(section.title,
                  style: Theme.of(context)
                      .textTheme
                      .titleLarge
                      ?.copyWith(fontWeight: FontWeight.w800)),
            ),
          ]),
          const SizedBox(height: 10),
          if (section.body != null)
            Text(section.body!, style: Theme.of(context).textTheme.bodyMedium),
          if (section.items.isNotEmpty) ...[
            if (section.body != null) const SizedBox(height: 8),
            ...section.items.map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 7),
                  child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Text('- '),
                    Expanded(child: Text(item)),
                  ]),
                )),
          ],
        ]),
      ),
    );
  }
}

class _SectionData {
  const _SectionData(this.title, this.icon, {this.body, this.items = const []});
  final String title;
  final IconData icon;
  final String? body;
  final List<String> items;
}

const _termsSections = [
  _SectionData(
    'Welcome to SaveWise',
    Icons.savings_outlined,
    body:
        'These Terms and Conditions govern your use of the SaveWise platform. By accessing or using our service, you agree to be bound by these terms.',
  ),
  _SectionData(
    '1. Eligibility',
    Icons.verified_user_outlined,
    items: [
      'You must be at least 18 years old to use SaveWise.',
      'You must provide accurate and complete information during registration.',
      'You are responsible for maintaining the security of your account.',
      'You agree not to share your account credentials with others.',
    ],
  ),
  _SectionData(
    '2. Service Usage',
    Icons.rule_folder_outlined,
    body:
        'SaveWise facilitates group savings plans. Each plan is managed by its owner, who has administrative privileges. SaveWise acts as a platform facilitator, not as a financial institution.',
    items: [
      'Users are solely responsible for transactions made through the platform.',
      'SaveWise does not hold funds, guarantee returns, or provide financial advice.',
      'Prohibited activity includes money laundering, fraud, harassment, illegal plans, and circumventing security measures.',
    ],
  ),
  _SectionData(
    '3. Financial Terms',
    Icons.account_balance_wallet_outlined,
    items: [
      'All deposits are voluntary and made at your own discretion.',
      'Deposit schedules and amounts are determined by each saving plan rules.',
      'Withdrawal requests must be approved by plan administrators.',
      'Processing times may vary and interest is calculated based on plan settings.',
    ],
  ),
  _SectionData(
    '4. Liability and Disclaimers',
    Icons.warning_amber_outlined,
    body:
        'SaveWise provides a platform for group savings but does not guarantee the financial performance, safety, or legality of individual saving plans.',
    items: [
      'We are not responsible for disputes between plan members.',
      'We are not responsible for failed transactions due to bank or payment issues.',
      'We are not responsible for losses incurred from saving plan activities.',
    ],
  ),
  _SectionData(
    '5. Changes to Terms',
    Icons.update_outlined,
    body:
        'We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.',
  ),
  _SectionData(
    'Contact for Questions',
    Icons.mail_outline,
    body:
        'If you have questions about these Terms and Conditions, contact legal@savewise.com. We typically respond within 24-48 hours on business days.',
  ),
];

const _privacySections = [
  _SectionData(
    'Our Commitment to Privacy',
    Icons.lock_outline,
    body:
        'At SaveWise, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.',
  ),
  _SectionData(
    '1. Information We Collect',
    Icons.person_search_outlined,
    items: [
      'Name and contact details, including email and phone number.',
      'Account credentials, profile information, and preferences.',
      'Payment information processed securely by payment providers.',
      'Device information, IP addresses, browser details, visited pages, feature usage, transaction history, and plan participation.',
    ],
  ),
  _SectionData(
    '2. How We Use Your Information',
    Icons.settings_suggest_outlined,
    items: [
      'Account creation and management.',
      'Transaction processing and plan administration.',
      'Customer support and platform optimization.',
      'Fraud prevention, security monitoring, analytics, and reporting.',
    ],
  ),
  _SectionData(
    '3. Information Sharing',
    Icons.visibility_outlined,
    body:
        'Other members of your saving plans can see your name and profile information. Financial details within a plan are visible to plan administrators and may be visible to other members based on plan settings.',
    items: [
      'We do not sell your personal information.',
      'We may share information with payment processors for transaction completion.',
      'We may share information with legal authorities when required by law.',
      'We may share information with service providers for platform operation.',
    ],
  ),
  _SectionData(
    '4. Data Security',
    Icons.security_outlined,
    items: [
      'Industry-standard security measures protect your information.',
      'Encryption helps protect data in transit and at rest.',
      'Strict authentication protocols protect account access.',
      'Security monitoring and testing support regular audits.',
    ],
  ),
  _SectionData(
    '5. Your Privacy Rights',
    Icons.fact_check_outlined,
    items: [
      'Right to access your data.',
      'Right to correct inaccurate information.',
      'Right to request deletion, with limitations.',
      'Right to data portability where available.',
    ],
  ),
  _SectionData(
    'Privacy Questions?',
    Icons.contact_support_outlined,
    body:
        'If you have questions about our Privacy Policy or your data, contact privacy@savewise.com.',
  ),
];

