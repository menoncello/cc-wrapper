# Security Guidelines

This document outlines security best practices for preventing sensitive data leaks in this repository.

## 🚫 Never Commit These Files

### Sensitive File Types

- **Keys & Certificates**: `.pem`, `.key`, `.p12`, `.pfx`, `.p8`, `.crt`, `.cer`, `.jks`, `.jceks`
- **Encrypted Files**: `.gpg`, `.pgp`, `.aes`, `.des`, `.enc`, `.rsa`, `.dsa`, `.ec`
- **Database Files**: `.sql`, `.dump`, `.backup`, `.pg_dump`, `.mysqldump`
- **Secret Files**: `*.secret`, `*.password`, `*.credential`, `*.token`, `*.auth`

### Configuration Files

- **Environment files**: `.env*`, `secrets.yml`, `docker-compose.override.yml`
- **API Keys & Tokens**: Files containing API keys, tokens, or secrets
- **Database Credentials**: Connection strings, DSNs, or auth credentials

## ✅ Safe Alternatives

### Environment Variables

```bash
# Use environment variables instead of hardcoding
# ✅ Good
const dbUrl = process.env.DATABASE_URL

# ❌ Bad
const dbUrl = "postgresql://user:password@localhost/db"
```

### Configuration Templates

```bash
# Use example templates instead of real configs
# ✅ Good
.env.example
config.template.json
docker-compose.example.yml

# ❌ Bad
.env
config.json
docker-compose.yml
```

### Test Data

```typescript
// Use mock/test data that's clearly identifiable
// ✅ Good
const testSecret = 'mock-test-key-for-testing-only-32-chars';

// ❌ Bad
const secret = 'real-production-key-12345';
```

## 🛡️ Automated Protection

This repository includes multiple layers of automated protection:

### 1. Pre-commit Hooks

- **Git-secrets**: Scans for common secret patterns
- **Gitleaks**: Comprehensive secret detection
- **File Pattern Checks**: Prevents sensitive file types
- **Size Checks**: Warns about large files

### 2. Git Hooks

- `.git/hooks/pre-commit`: Combined security scanning
- `.git/hooks/pre-commit-security`: Custom security checks
- `.git/hooks/commit-msg`: Commit message validation

### 3. .gitignore Rules

Comprehensive ignore rules prevent accidental commits of sensitive files.

## 🔍 Manual Security Checklist

### Before Committing

1. **Review diff**: `git diff --cached` - check for secrets
2. **Search patterns**: Look for `password`, `secret`, `key`, `token`
3. **File review**: Ensure no sensitive files are staged
4. **Test data**: Verify test secrets are clearly marked as test data

### Code Review

1. **Secret detection**: Review for hardcoded credentials
2. **Environment usage**: Check for proper environment variable usage
3. **File inclusion**: Ensure sensitive files aren't accidentally included
4. **Dependencies**: Review third-party dependencies for security issues

## 🚨 If You Find a Leak

1. **Stop the commit** immediately
2. **Remove the sensitive data** from the working directory
3. **Remove from git history** if already committed:
   ```bash
   git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch sensitive-file' --prune-empty --tag-name-filter cat -- --all
   ```
4. **Rotate/Revoke** any exposed credentials immediately
5. **Notify security team** if this is a production repository

## 📞 Security Contacts

If you discover a security vulnerability or leak:

- **Internal**: Contact your security team immediately
- **External**: Follow responsible disclosure practices

## 🔧 Tools Used

- **[Gitleaks](https://github.com/zricethezav/gitleaks)**: Secret scanning
- **[Git-secrets](https://github.com/awslabs/git-secrets)**: Prevent secret commits
- **Pre-commit hooks**: Automated security checks
- **Comprehensive .gitignore**: Prevents accidental file inclusion

## 📚 References

- [OWASP Secrets in Code](https://owasp.org/www-project-secrets-in-code/)
- [Git Security Best Practices](https://github.com/topics/git-security)
- [Secrets Detection Patterns](https://github.com/zricethezav/gitleaks#configuration)

---

## CC Wrapper Project Security

### Security Status

This document outlines the security practices and policies for the CC Wrapper project.

## Security Practices

### Development Environment Security

1. **No Hardcoded Credentials in Production Code**
   - Development passwords are unique to this project
   - Production credentials must use environment variables
   - Database passwords use generated values, not dictionary words

2. **Command Execution Security**
   - All shell commands use parameterized execution
   - No dynamic command construction with user input
   - Commands executed through Bun's `$` template literal system for safety

3. **Environment Variable Security**
   - Sensitive data stored in `.env.local` (gitignored)
   - Validation of all environment variables
   - Type checking for URL-based configurations

### Database Security

1. **Development Database**
   - Uses unique password: `ccwrapper_dev_pass_2025`
   - Database name: `ccwrapper_dev`
   - User: `ccwrapper`
   - Port: 5432 (standard)

2. **Connection Security**
   - All database connections use parameterized queries
   - URL validation prevents malformed connection strings
   - Protocol validation ensures only allowed protocols (postgresql, redis)

### Input Validation

1. **URL Validation**
   - All URL-based environment variables are validated
   - Protocol checking prevents malformed URLs
   - Hostname validation ensures proper connection targets

2. **Port Validation**
   - Port numbers are validated to be within valid range (1-65535)
   - Default ports provided when not specified

3. **Environment Validation**
   - Required environment variables are checked at startup
   - Missing variables cause immediate failure with clear error messages

## Security Checklist

### Development Setup Security

- [x] No hardcoded production passwords
- [x] Unique development database password
- [x] Environment variable validation
- [x] URL validation for database connections
- [x] Port range validation
- [x] No dynamic command construction

### Production Security (Future Implementation)

- [ ] Production secrets management
- [ ] Encrypted secrets storage
- [ ] Database connection encryption
- [ ] API key rotation procedures
- [ ] Access logging and monitoring
- [ ] Security audit logging

## Reporting Security Issues

If you discover a security vulnerability, please report it privately.

### How to Report

1. **Private Issues Only**
   - Do not create public GitHub issues for security problems
   - Use private communication channels

2. **Provide Details**
   - Describe the vulnerability clearly
   - Include steps to reproduce (if safe)
   - Explain potential impact

3. **Responsible Disclosure**
   - Allow reasonable time to fix before disclosure
   - Work with maintainers on coordinated release

### Contact

For security issues, contact the project maintainers through private channels.

## Security Updates

### Version Information

- Current security version: 1.0.0
- Last security review: 2025-10-19
- Next review scheduled: 2026-01-19

### Update Process

1. **Assessment**
   - Evaluate vulnerability severity
   - Determine impact assessment
   - Plan remediation timeline

2. **Fix Development**
   - Develop secure patches
   - Test fixes thoroughly
   - Update documentation

3. **Release**
   - Coordinate disclosure timeline
   - Release security updates
   - Update security policies

## Best Practices

### Development

1. **Never commit secrets**
   - Use environment variables for all sensitive data
   - Add `.env.local` to `.gitignore`
   - Use different passwords for development/production

2. **Validate all inputs**
   - Validate environment variables at startup
   - Check URL formats and protocols
   - Validate numeric ranges (ports, etc.)

3. **Use secure defaults**
   - Require explicit configuration for sensitive operations
   - Fail securely when configuration is invalid
   - Provide clear error messages for debugging

### Deployment

1. **Environment separation**
   - Different configurations for development/production
   - Unique passwords for each environment
   - Separate databases for different environments

2. **Access control**
   - Principle of least privilege
   - Regular access reviews
   - Audit logging for sensitive operations

## Dependencies

### Security Updates

- Regular dependency updates
- Automated security scanning (future implementation)
- Vulnerability monitoring
- Patch management process

### Known Dependencies

- Bun 1.3.0 - JavaScript runtime
- PostgreSQL 18.0 - Database
- Redis 8.2.2 - Cache
- Docker 28.5.1 - Containerization

## Compliance

### Standards

This project aims to comply with:

- OWASP Secure Coding Practices
- Common security standards for web applications
- Industry best practices for development tools

### Data Protection

- No personal data collection in development tools
- Local data processing only
- User privacy protection principles
