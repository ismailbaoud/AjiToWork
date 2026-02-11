# 🔐 Security Documentation

## Password Security Implementation

This document describes the security measures implemented for password handling in the JobFinder application.

---

## Overview

All user passwords are securely hashed using **bcrypt** before storage. This implementation follows industry best practices to protect user credentials.

---

## ⚠️ Important Security Notice

**For Development Only:** This implementation uses client-side password hashing with `bcryptjs` because we're using `json-server` as a mock backend.

**⚠️ In Production:** Password hashing **MUST** be moved to the server-side. Never hash passwords on the client in production environments.

### Why Server-Side Hashing?

1. **Network Security**: Plain text passwords should never be transmitted
2. **Client Tampering**: Client-side code can be modified by users
3. **Resource Control**: Server controls hashing complexity (salt rounds)
4. **Audit Trail**: Server-side logging of authentication attempts
5. **Rate Limiting**: Prevent brute-force attacks server-side

---

## Implementation Details

### 1. Password Service

**Location:** `src/app/core/services/password.service.ts`

The `PasswordService` provides secure password operations:

```typescript
// Hash a password
const hashed = await passwordService.hashPassword('myPassword123');

// Verify a password
const isValid = await passwordService.verifyPassword('myPassword123', hashed);

// Check if already hashed
const isHashed = passwordService.isHashed('$2b$10$...');

// Validate password strength
const validation = passwordService.validatePasswordStrength('Pass123!');
```

### 2. Bcrypt Configuration

- **Algorithm**: bcrypt
- **Salt Rounds**: 10 (configurable in PasswordService)
- **Hash Format**: `$2b$10$...` (bcrypt version 2b)

#### Salt Rounds Explained

| Rounds | Time (approx) | Security Level |
|--------|---------------|----------------|
| 10     | ~100ms        | ✅ Recommended |
| 12     | ~400ms        | Strong         |
| 14     | ~1.6s         | Very Strong    |
| 16     | ~6.4s         | Maximum        |

**Current Setting**: 10 rounds (good balance of security and performance)

---

## Password Requirements

### Minimum Requirements (Current)

- ✅ At least **8 characters** long
- ✅ Contains uppercase and lowercase letters
- ✅ Contains at least one number
- ✅ Contains at least one special character

### Recommended Requirements (Optional)

Consider implementing:
- Minimum 12 characters
- No common passwords (dictionary check)
- No personal information (name, email)
- Password history (prevent reuse)
- Expiration policy (90 days)

---

## Migration Script

### Purpose

The migration script (`scripts/hash-passwords.js`) converts existing plain text passwords to bcrypt hashes.

### Usage

```bash
# Run the migration
npm run hash-passwords

# Or directly
node scripts/hash-passwords.js
```

### What It Does

1. ✅ Reads `db.json`
2. ✅ Creates backup (`db.json.backup`)
3. ✅ Identifies plain text passwords
4. ✅ Hashes each password with bcrypt
5. ✅ Updates database with hashed passwords
6. ✅ Provides detailed summary

### Safety Features

- **Automatic Backup**: Creates `db.json.backup` before changes
- **Idempotent**: Can be run multiple times safely
- **Detection**: Skips already-hashed passwords
- **Error Handling**: Continues on individual failures

---

## Authentication Flow

### Registration Flow

```
User Input (plain password)
    ↓
Password Validation
    ↓
Hash Password (bcrypt)
    ↓
Send Hashed Password to API
    ↓
Store in Database
```

**Code:**
```typescript
// In AuthService.register()
const hashedPassword = await this.passwordService.hashPassword(password);
const user = { ...userData, password: hashedPassword };
return this.http.post<User>(this.baseUrl, user);
```

### Login Flow

```
User Input (plain password)
    ↓
Fetch User from API
    ↓
Compare Plain with Hashed (bcrypt.compare)
    ↓
If Match: Authenticate
    ↓
Return Auth Token/User Data
```

**Code:**
```typescript
// In AuthService.login()
const user = await this.fetchUser(email);
const isValid = await this.passwordService.verifyPassword(
  plainPassword,
  user.password
);
if (isValid) {
  this.setAuthState(user);
}
```

---

## Database Security

### Current Structure (db.json)

```json
{
  "users": [
    {
      "id": "1",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "password": "$2b$10$abcdef..." // ✅ Hashed
    }
  ]
}
```

### Password Format

- **Plain Text** (❌ OLD): `password123`
- **Bcrypt Hash** (✅ NEW): `$2b$10$iRaSKNaHJMokGrrEUPhU6eYePlqSkctSN...`

### Hash Components

A bcrypt hash like `$2b$10$iRaSKNaHJMokGrrEUPhU6eYePlqSkctSN...` contains:

```
$2b$     - Algorithm identifier (bcrypt version 2b)
10$      - Cost factor (2^10 = 1024 iterations)
iRaSK... - 22-char salt (random per password)
NaHJM... - 31-char hash (actual password hash)
```

---

## Security Best Practices

### ✅ Implemented

- [x] Password hashing with bcrypt
- [x] Unique salt per password
- [x] Configurable salt rounds
- [x] Password strength validation
- [x] Hash detection (prevent double-hashing)
- [x] Migration script with backups
- [x] Secure password comparison
- [x] No password exposure in logs
- [x] Type-safe password operations

### ⏳ Recommended for Production

- [ ] **Server-Side Hashing** (CRITICAL)
- [ ] HTTPS/TLS encryption
- [ ] Rate limiting on login attempts
- [ ] Account lockout after failed attempts
- [ ] Two-factor authentication (2FA)
- [ ] Password reset with email verification
- [ ] Session management with JWT
- [ ] Password expiration policy
- [ ] Security headers (CSP, HSTS, etc.)
- [ ] Audit logging of auth events
- [ ] Intrusion detection system

### 🚫 Security Anti-Patterns to Avoid

- ❌ Never store passwords in plain text
- ❌ Never log passwords (even hashed)
- ❌ Never send passwords in URLs
- ❌ Never use weak hashing (MD5, SHA1)
- ❌ Never use same salt for all passwords
- ❌ Never transmit without HTTPS
- ❌ Never store passwords in localStorage (tokens only)
- ❌ Never hash on client in production

---

## Testing Password Security

### Test Hashing

```typescript
describe('PasswordService', () => {
  it('should hash password differently each time', async () => {
    const password = 'test123';
    const hash1 = await service.hashPassword(password);
    const hash2 = await service.hashPassword(password);
    
    expect(hash1).not.toBe(hash2); // Different salts
    expect(await service.verifyPassword(password, hash1)).toBe(true);
    expect(await service.verifyPassword(password, hash2)).toBe(true);
  });
  
  it('should detect bcrypt hashes', () => {
    expect(service.isHashed('$2b$10$abc...')).toBe(true);
    expect(service.isHashed('plaintext')).toBe(false);
  });
});
```

### Test Authentication

```typescript
describe('AuthService', () => {
  it('should reject wrong password', async () => {
    const result = await service.login({
      email: 'user@test.com',
      password: 'wrongPassword'
    });
    
    expect(result).toThrow('Invalid password');
  });
  
  it('should accept correct password', async () => {
    const result = await service.login({
      email: 'user@test.com',
      password: 'correctPassword'
    });
    
    expect(result).toBeTruthy();
    expect(result.email).toBe('user@test.com');
  });
});
```

---

## Migration Guide

### From Plain Text to Hashed Passwords

If you have existing plain text passwords in your database:

**Step 1: Backup**
```bash
cp db.json db.json.backup
```

**Step 2: Run Migration**
```bash
npm run hash-passwords
```

**Step 3: Verify**
- Check `db.json` - passwords should start with `$2b$10$`
- Backup saved at `db.json.backup`
- Test login with original passwords

**Step 4: Commit Changes**
```bash
git add db.json
git commit -m "security: hash all user passwords"
```

### Rollback (If Needed)

```bash
cp db.json.backup db.json
```

---

## Troubleshooting

### Issue: "Error hashing password"

**Cause**: bcryptjs installation issue

**Solution**:
```bash
npm install bcryptjs @types/bcryptjs
```

### Issue: "Invalid password" on correct password

**Possible Causes**:
1. Password not hashed in database
2. Wrong comparison method
3. Character encoding issues

**Solutions**:
1. Run migration script: `npm run hash-passwords`
2. Verify using `passwordService.verifyPassword()`
3. Check for whitespace/trim issues

### Issue: Login is slow

**Cause**: High salt rounds (>12)

**Solution**: Balance security vs. performance
- Keep at 10 rounds for most applications
- Use 12+ only for highly sensitive data
- Consider async operations

---

## Performance Considerations

### Bcrypt is Intentionally Slow

Bcrypt is designed to be computationally expensive to prevent brute-force attacks.

**Typical Timings:**
- Hash password: ~100ms (10 rounds)
- Verify password: ~100ms (10 rounds)

**Optimization Tips:**
1. Use async/await properly
2. Show loading indicators during auth
3. Don't hash passwords unnecessarily
4. Cache authentication results (JWT tokens)
5. Use appropriate salt rounds

### Example: Async Implementation

```typescript
// ✅ GOOD - Non-blocking
async login(credentials: UserLogin): Promise<AuthUser> {
  this.isLoading.set(true);
  const user = await this.getUser(credentials.email);
  const isValid = await this.passwordService.verifyPassword(
    credentials.password,
    user.password
  );
  this.isLoading.set(false);
  return isValid ? user : null;
}

// ❌ BAD - Blocking UI
login(credentials: UserLogin): AuthUser {
  const hash = bcrypt.hashSync(credentials.password, 10); // Blocks!
  // ...
}
```

---

## Compliance & Regulations

### GDPR (Europe)

- ✅ Passwords are encrypted (hashed)
- ✅ Right to be forgotten (delete user = delete hash)
- ⚠️ Need: Data breach notification procedures

### CCPA (California)

- ✅ Passwords not sold/shared
- ⚠️ Need: Privacy policy disclosure

### OWASP Top 10

- ✅ A02: Cryptographic Failures - Using strong hashing
- ✅ A07: Identification & Auth Failures - Secure password storage

---

## Future Enhancements

### Priority 1: Server-Side Implementation

When moving to real backend:

```typescript
// Backend (Node.js/Express)
app.post('/register', async (req, res) => {
  const { password, ...userData } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await db.users.create({
    ...userData,
    password: hashedPassword
  });
  res.json({ user: sanitize(user) });
});

app.post('/login', async (req, res) => {
  const user = await db.users.findByEmail(req.body.email);
  const isValid = await bcrypt.compare(req.body.password, user.password);
  if (isValid) {
    const token = jwt.sign({ userId: user.id }, SECRET);
    res.json({ token });
  }
});
```

### Priority 2: Additional Features

- [ ] Password reset via email
- [ ] Two-factor authentication (TOTP)
- [ ] OAuth integration (Google, GitHub)
- [ ] Biometric authentication
- [ ] Passwordless authentication (magic links)

---

## Resources

### Documentation
- [bcrypt npm package](https://www.npmjs.com/package/bcryptjs)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)

### Tools
- [Have I Been Pwned](https://haveibeenpwned.com/) - Check for compromised passwords
- [Password Strength Tester](https://www.passwordmonster.com/)

### Security Standards
- OWASP Top 10
- NIST SP 800-63B (Digital Identity Guidelines)
- PCI DSS (Payment Card Industry Data Security Standard)

---

## Changelog

### v1.0.0 (Current)
- ✅ Implemented bcrypt password hashing
- ✅ Created PasswordService
- ✅ Updated AuthService with hashing
- ✅ Added migration script
- ✅ Hashed all existing passwords
- ✅ Added security documentation

### Future Versions
- v1.1.0: Password strength indicator UI
- v1.2.0: Password reset functionality
- v1.3.0: Two-factor authentication
- v2.0.0: Server-side implementation

---

## Contact

For security concerns or questions:
- Review this documentation
- Check the code in `src/app/core/services/password.service.ts`
- Review the auth service implementation
- Run the migration script if needed

---

## Security Disclosure

If you discover a security vulnerability, please:

1. **DO NOT** open a public issue
2. Email the maintainer privately
3. Include details of the vulnerability
4. Allow reasonable time for fixes

---

*Last Updated: December 2024*
*Security Level: Development (Move to server-side for production)*
*Compliance: OWASP, NIST recommendations*