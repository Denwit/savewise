import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../models/user_session.dart';
import 'legal_screen.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({
    super.key,
    required this.apiClient,
    required this.onAuthenticated,
  });

  final ApiClient apiClient;
  final ValueChanged<UserSession> onAuthenticated;

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _phoneController = TextEditingController();
  bool _isRegistering = false;
  bool _isLoading = false;
  bool _rememberMe = false;
  bool _acceptedTerms = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  String? _error;

  static const _blue = Color(0xFF497FFF);
  static const _whiteShade = Color(0xFFF8F9FA);
  static const _grayShade = Color(0xFFEBEBEB);
  static const _hintText = Color(0xFFC7C7CD);
  static const _blackShade = Color(0xFF555555);

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _blue,
      body: SafeArea(
        child: Column(
          children: [
            _AuthHeader(
              title: _isRegistering ? 'Sign Up.' : 'Log In.',
              onTap: _toggleMode,
            ),
            Expanded(
              child: Container(
                width: double.infinity,
                decoration: const BoxDecoration(
                  color: _whiteShade,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(28),
                    topRight: Radius.circular(28),
                  ),
                ),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 420),
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.fromLTRB(0, 4, 0, 14),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            _HeroImage(height: _isRegistering ? 68 : 78),
                            const SizedBox(height: 4),
                            Padding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 20),
                              child: Text(
                                'SaveWise',
                                textAlign: TextAlign.center,
                                style: Theme.of(context)
                                    .textTheme
                                    .titleLarge
                                    ?.copyWith(
                                      color: _blackShade,
                                      fontWeight: FontWeight.w900,
                                    ),
                              ),
                            ),
                            const SizedBox(height: 6),
                            if (_isRegistering) ...[
                              _AuthField(
                                headingText: 'Username',
                                hintText: 'username',
                                controller: _nameController,
                                icon: Icons.person_outline,
                                textInputAction: TextInputAction.next,
                                validator: (value) =>
                                    value == null || value.trim().length < 3
                                        ? 'Use at least 3 characters'
                                        : null,
                              ),
                              const SizedBox(height: 10),
                              _AuthField(
                                headingText: 'Phone number',
                                hintText: '+260 123 456 789',
                                controller: _phoneController,
                                icon: Icons.phone_outlined,
                                keyboardType: TextInputType.phone,
                                textInputAction: TextInputAction.next,
                              ),
                              const SizedBox(height: 10),
                            ],
                            _AuthField(
                              headingText: 'Email',
                              hintText: 'Email',
                              controller: _emailController,
                              icon: Icons.mail_outline,
                              keyboardType: TextInputType.emailAddress,
                              textInputAction: TextInputAction.next,
                              validator: (value) =>
                                  value == null || !value.contains('@')
                                      ? 'Enter a valid email'
                                      : null,
                            ),
                            const SizedBox(height: 10),
                            _AuthField(
                              headingText: 'Password',
                              hintText: 'At least 6 characters',
                              controller: _passwordController,
                              icon: Icons.lock_outline,
                              obscureText: _obscurePassword,
                              textInputAction: _isRegistering
                                  ? TextInputAction.next
                                  : TextInputAction.done,
                              suffixIcon: IconButton(
                                tooltip: _obscurePassword
                                    ? 'Show password'
                                    : 'Hide password',
                                icon: Icon(_obscurePassword
                                    ? Icons.visibility_outlined
                                    : Icons.visibility_off_outlined),
                                onPressed: () => setState(
                                    () => _obscurePassword = !_obscurePassword),
                              ),
                              validator: (value) =>
                                  value == null || value.length < 6
                                      ? 'Use at least 6 characters'
                                      : null,
                              onFieldSubmitted: (_) {
                                if (!_isRegistering) _submit();
                              },
                            ),
                            if (_isRegistering) ...[
                              const SizedBox(height: 10),
                              _AuthField(
                                headingText: 'Confirm password',
                                hintText: 'Repeat password',
                                controller: _confirmPasswordController,
                                icon: Icons.lock_outline,
                                obscureText: _obscureConfirmPassword,
                                textInputAction: TextInputAction.done,
                                suffixIcon: IconButton(
                                  tooltip: _obscureConfirmPassword
                                      ? 'Show password'
                                      : 'Hide password',
                                  icon: Icon(_obscureConfirmPassword
                                      ? Icons.visibility_outlined
                                      : Icons.visibility_off_outlined),
                                  onPressed: () => setState(() =>
                                      _obscureConfirmPassword =
                                          !_obscureConfirmPassword),
                                ),
                                validator: (value) =>
                                    value != _passwordController.text
                                        ? 'Passwords do not match'
                                        : null,
                                onFieldSubmitted: (_) => _submit(),
                              ),
                            ],
                            const SizedBox(height: 6),
                            if (_isRegistering)
                              Padding(
                                padding:
                                    const EdgeInsets.symmetric(horizontal: 20),
                                child: Material(
                                  color: Colors.transparent,
                                  child: CheckboxListTile(
                                    contentPadding: EdgeInsets.zero,
                                    value: _acceptedTerms,
                                    controlAffinity:
                                        ListTileControlAffinity.leading,
                                    activeColor: _blue,
                                    onChanged: (value) => setState(
                                        () => _acceptedTerms = value ?? false),
                                    title: Wrap(
                                      children: [
                                        const Text('I agree to the '),
                                        _InlineLink(
                                            text: 'Terms of Service',
                                            onTap: () => _openLegal(
                                                LegalDocument.terms)),
                                        const Text(' and '),
                                        _InlineLink(
                                            text: 'Privacy Policy',
                                            onTap: () => _openLegal(
                                                LegalDocument.privacy)),
                                      ],
                                    ),
                                  ),
                                ),
                              )
                            else
                              Padding(
                                padding:
                                    const EdgeInsets.symmetric(horizontal: 12),
                                child: Row(
                                  children: [
                                    Checkbox(
                                      value: _rememberMe,
                                      activeColor: _blue,
                                      onChanged: (value) => setState(
                                          () => _rememberMe = value ?? false),
                                    ),
                                    const Expanded(child: Text('Remember me')),
                                    TextButton(
                                      onPressed:
                                          _isLoading ? null : _forgotPassword,
                                      child: const Text('Forgot Password?'),
                                    ),
                                  ],
                                ),
                              ),
                            if (_error != null) ...[
                              const SizedBox(height: 6),
                              Padding(
                                padding:
                                    const EdgeInsets.symmetric(horizontal: 20),
                                child: Text(
                                  _error!,
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                      color:
                                          Theme.of(context).colorScheme.error),
                                ),
                              ),
                            ],
                            const SizedBox(height: 10),
                            _AuthButton(
                              onTap: _isLoading ? null : _submit,
                              text: _isRegistering
                                  ? (_isLoading
                                      ? 'Creating account...'
                                      : 'Sign Up')
                                  : (_isLoading ? 'Signing in...' : 'Sign In'),
                              loading: _isLoading,
                            ),
                            const SizedBox(height: 12),
                            _AuthRichText(
                              description: _isRegistering
                                  ? 'Already Have an account? '
                                  : "Don't already Have an account? ",
                              text: _isRegistering ? 'Log In here' : 'Sign Up',
                              onTap: _toggleMode,
                            ),
                            const SizedBox(height: 10),
                            Wrap(
                              alignment: WrapAlignment.center,
                              spacing: 8,
                              runSpacing: 4,
                              children: [
                                _InlineLink(
                                    text: 'Terms of Service',
                                    onTap: () =>
                                        _openLegal(LegalDocument.terms)),
                                const Text('|',
                                    style: TextStyle(color: _hintText)),
                                _InlineLink(
                                    text: 'Privacy Policy',
                                    onTap: () =>
                                        _openLegal(LegalDocument.privacy)),
                                const Text('|',
                                    style: TextStyle(color: _hintText)),
                                _InlineLink(
                                    text: 'Contact us',
                                    onTap: () => _showInfo(
                                        'Email legal@savewise.com or privacy@savewise.com.')),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _toggleMode() {
    setState(() {
      _isRegistering = !_isRegistering;
      _error = null;
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_isRegistering && !_acceptedTerms) {
      setState(() => _error = 'Please accept the Terms and Privacy Policy.');
      return;
    }
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final session = _isRegistering
          ? await widget.apiClient.register(
              username: _nameController.text.trim(),
              email: _emailController.text.trim(),
              password: _passwordController.text,
              phone: _phoneController.text.trim(),
            )
          : await widget.apiClient.login(
              _emailController.text.trim(),
              _passwordController.text,
            );
      widget.onAuthenticated(session);
    } on ApiException catch (error) {
      setState(() => _error = error.message);
    } catch (_) {
      setState(() => _error =
          'Could not reach the SaveWise API. Check that the backend is running.');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _forgotPassword() async {
    final email = TextEditingController(text: _emailController.text.trim());
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reset password'),
        content: TextField(
          controller: email,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(
            labelText: 'Email address',
            prefixIcon: Icon(Icons.mail_outline),
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Cancel')),
          FilledButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: const Text('Send reset link')),
        ],
      ),
    );
    if (ok != true || email.text.trim().isEmpty) return;
    setState(() => _isLoading = true);
    try {
      final message = await widget.apiClient.forgotPassword(email.text.trim());
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(message)));
      }
    } on ApiException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(error.message)));
      }
    } finally {
      email.dispose();
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _openLegal(LegalDocument document) {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => LegalScreen(document: document),
    ));
  }

  void _showInfo(String message) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }
}

class _AuthHeader extends StatelessWidget {
  const _AuthHeader({required this.title, required this.onTap});

  final String title;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(top: 8, left: 14),
        child: Row(
          children: [
            InkWell(
              onTap: onTap,
              borderRadius: BorderRadius.circular(20),
              child: const Padding(
                padding: EdgeInsets.all(4),
                child: Icon(Icons.arrow_back_ios_new_rounded,
                    color: _AuthScreenState._whiteShade, size: 20),
              ),
            ),
            const SizedBox(width: 10),
            Text(
              title,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: _AuthScreenState._whiteShade,
                    fontWeight: FontWeight.w800,
                  ),
            ),
          ],
        ),
      );
}

class _HeroImage extends StatelessWidget {
  const _HeroImage({required this.height});

  final double height;

  @override
  Widget build(BuildContext context) => SizedBox(
        height: height,
        child: Image.asset(
          'assets/images/savewise_logo_transparent.png',
          fit: BoxFit.contain,
          errorBuilder: (context, error, stackTrace) => const Icon(
            Icons.savings_outlined,
            color: _AuthScreenState._blue,
            size: 84,
          ),
        ),
      );
}

class _AuthField extends StatelessWidget {
  const _AuthField({
    required this.headingText,
    required this.hintText,
    required this.controller,
    required this.icon,
    this.keyboardType = TextInputType.text,
    this.textInputAction = TextInputAction.next,
    this.obscureText = false,
    this.suffixIcon,
    this.validator,
    this.onFieldSubmitted,
  });

  final String headingText;
  final String hintText;
  final TextEditingController controller;
  final IconData icon;
  final TextInputType keyboardType;
  final TextInputAction textInputAction;
  final bool obscureText;
  final Widget? suffixIcon;
  final String? Function(String?)? validator;
  final ValueChanged<String>? onFieldSubmitted;

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 18, right: 18, bottom: 5),
            child: Text(
              headingText,
              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: _AuthScreenState._blackShade,
                    fontWeight: FontWeight.w700,
                  ),
            ),
          ),
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 18),
            decoration: BoxDecoration(
              color: _AuthScreenState._grayShade,
              borderRadius: BorderRadius.circular(12),
            ),
            child: TextFormField(
              controller: controller,
              keyboardType: keyboardType,
              textInputAction: textInputAction,
              obscureText: obscureText,
              validator: validator,
              onFieldSubmitted: onFieldSubmitted,
              decoration: InputDecoration(
                hintText: hintText,
                hintStyle: const TextStyle(color: _AuthScreenState._hintText),
                border: InputBorder.none,
                prefixIcon: Icon(icon, color: _AuthScreenState._blue),
                suffixIcon: suffixIcon,
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
              ),
            ),
          ),
        ],
      );
}

class _AuthButton extends StatelessWidget {
  const _AuthButton({
    required this.onTap,
    required this.text,
    required this.loading,
  });

  final VoidCallback? onTap;
  final String text;
  final bool loading;

  @override
  Widget build(BuildContext context) => InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          height: 42,
          margin: const EdgeInsets.symmetric(horizontal: 18),
          decoration: BoxDecoration(
            color: onTap == null
                ? _AuthScreenState._blue.withValues(alpha: 0.55)
                : _AuthScreenState._blue,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Center(
            child: loading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  )
                : Text(
                    text,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                        ),
                  ),
          ),
        ),
      );
}

class _AuthRichText extends StatelessWidget {
  const _AuthRichText({
    required this.description,
    required this.text,
    required this.onTap,
  });

  final String description;
  final String text;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Flexible(
            child: Text(
              description,
              textAlign: TextAlign.center,
              style: const TextStyle(color: _AuthScreenState._blackShade),
            ),
          ),
          InkWell(
            onTap: onTap,
            child: Text(
              text,
              style: const TextStyle(
                color: _AuthScreenState._blue,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      );
}

class _InlineLink extends StatelessWidget {
  const _InlineLink({required this.text, required this.onTap});

  final String text;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => InkWell(
        onTap: onTap,
        child: Text(
          text,
          style: const TextStyle(
            color: _AuthScreenState._blue,
            fontWeight: FontWeight.w700,
          ),
        ),
      );
}

