# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly.

### How to Report

**Please do not** report security vulnerabilities through public GitHub issues.

Instead, please send an email to: mukhamedjankydyrli@gmail.com

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if known)

### What to Expect

- We will acknowledge receipt of your report within 48 hours
- We will provide a detailed response within 7 days
- We will work with you to understand and resolve the issue
- We will notify you when the issue is fixed
- We will credit you in the release notes (if you wish)

### Security Best Practices

- Keep your API keys secure and never commit them to version control
- Use environment variables for sensitive configuration
- Keep dependencies updated
- Review security advisories for dependencies regularly
- Use HTTPS for all API calls
- Implement rate limiting on your API endpoints
- Validate and sanitize all user inputs

### Data Privacy

Roka processes your data locally by default (CLI and MCP prune tools). When using the cloud API:
- Data is encrypted in transit (TLS 1.2+)
- We do not sell your data to third parties
- We do not train models on your logs
- You can request data deletion at any time

Enterprise options (SSO, audit logs, data residency, formal compliance reviews) are available for discussion — email mukhamedjankydyrli@gmail.com.

Thank you for helping keep Roka secure!
