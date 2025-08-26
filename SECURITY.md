# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of our software seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Reporting Process

1. **DO NOT** disclose the vulnerability publicly until it has been addressed.
2. Email your findings to security@habittracker.com (or create a private security advisory on GitHub).
3. Include the following information:
   - Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
   - Full paths of source file(s) related to the manifestation of the issue
   - The location of the affected source code (tag/branch/commit or direct URL)
   - Any special configuration required to reproduce the issue
   - Step-by-step instructions to reproduce the issue
   - Proof-of-concept or exploit code (if possible)
   - Impact of the issue, including how an attacker might exploit it

### Response Timeline

- We will acknowledge receipt of your vulnerability report within 48 hours.
- We will provide a more detailed response within 7 days indicating the next steps.
- We will work on fixing the vulnerability and will keep you informed of our progress.
- Once the vulnerability is fixed, we will notify you and publicly disclose the security issue.

## Security Best Practices

### For Contributors

1. **Never commit secrets** - Use environment variables for sensitive data
2. **Validate all inputs** - Use Zod schemas for validation
3. **Authenticate and authorize** - Ensure all API routes check user permissions
4. **Use parameterized queries** - Never concatenate user input in SQL queries
5. **Keep dependencies updated** - Regularly update packages and check for vulnerabilities

### For Users

1. **Use strong passwords** - Enable 2FA when available
2. **Keep your instance updated** - Apply security patches promptly
3. **Use HTTPS** - Always access the application over encrypted connections
4. **Report suspicious activity** - Contact us if you notice anything unusual

## Security Features

Our application implements the following security measures:

### Authentication & Authorization
- Clerk authentication for secure user management
- Session-based authentication with secure cookies
- Role-based access control (RBAC)
- User data isolation

### Input Validation
- Zod schema validation on all API endpoints
- HTML sanitization for user-generated content
- Request size limits (10KB default)
- File upload restrictions

### Security Headers
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Referrer-Policy: strict-origin-when-cross-origin

### Rate Limiting
- IP-based rate limiting (60 requests/minute)
- User-based rate limiting (100 requests/minute)
- API key rate limiting for external integrations

### Data Protection
- Encrypted database connections
- Secure password hashing with Clerk
- PII redaction in logs
- Regular security audits

### Infrastructure
- Environment variable protection
- Secret rotation policies
- Dependency vulnerability scanning
- Container security scanning

## Compliance

We strive to comply with:
- OWASP Top 10 security practices
- GDPR for EU users
- SOC 2 Type II principles (in progress)

## Security Audits

- Quarterly dependency audits
- Annual penetration testing
- Continuous security monitoring with Sentry
- Automated vulnerability scanning in CI/CD

## Contact

For security concerns, please contact:
- Email: security@habittracker.com
- GitHub Security Advisories: [Create Advisory](https://github.com/your-org/habit-tracker/security/advisories/new)

Thank you for helping keep our application and our users safe!