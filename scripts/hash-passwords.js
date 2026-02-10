/**
 * Script to hash plain text passwords in db.json
 *
 * Usage: node scripts/hash-passwords.js
 *
 * This script will:
 * 1. Read db.json
 * 2. Hash all plain text passwords using bcrypt
 * 3. Update db.json with hashed passwords
 * 4. Create a backup of the original file
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', 'db.json');
const BACKUP_PATH = path.join(__dirname, '..', 'db.json.backup');
const SALT_ROUNDS = 10;

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

/**
 * Check if a password is already hashed (bcrypt format)
 */
function isHashed(password) {
  const bcryptPattern = /^\$2[aby]\$\d{2}\$/;
  return bcryptPattern.test(password);
}

/**
 * Hash a plain text password
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return await bcrypt.hash(password, salt);
}

/**
 * Main function to process passwords
 */
async function hashPasswords() {
  try {
    console.log(`${colors.bright}${colors.blue}========================================${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}  Password Hashing Script${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}========================================${colors.reset}\n`);

    // Check if db.json exists
    if (!fs.existsSync(DB_PATH)) {
      console.error(`${colors.red}❌ Error: db.json not found at ${DB_PATH}${colors.reset}`);
      process.exit(1);
    }

    console.log(`${colors.cyan}📂 Reading database file...${colors.reset}`);
    const dbContent = fs.readFileSync(DB_PATH, 'utf8');
    const db = JSON.parse(dbContent);

    if (!db.users || !Array.isArray(db.users)) {
      console.error(`${colors.red}❌ Error: No users array found in db.json${colors.reset}`);
      process.exit(1);
    }

    console.log(`${colors.green}✓ Found ${db.users.length} users${colors.reset}\n`);

    // Create backup
    console.log(`${colors.cyan}💾 Creating backup...${colors.reset}`);
    fs.writeFileSync(BACKUP_PATH, dbContent);
    console.log(`${colors.green}✓ Backup created at db.json.backup${colors.reset}\n`);

    // Process each user
    let hashedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    console.log(`${colors.cyan}🔐 Processing passwords...${colors.reset}\n`);

    for (let i = 0; i < db.users.length; i++) {
      const user = db.users[i];
      const userDisplay = `${user.firstName} ${user.lastName} (${user.email})`;

      try {
        if (!user.password) {
          console.log(`${colors.yellow}⚠  User ${i + 1}/${db.users.length}: ${userDisplay} - No password field${colors.reset}`);
          errorCount++;
          continue;
        }

        if (isHashed(user.password)) {
          console.log(`${colors.blue}⏭  User ${i + 1}/${db.users.length}: ${userDisplay} - Already hashed${colors.reset}`);
          skippedCount++;
          continue;
        }

        // Store original password for logging
        const originalPassword = user.password;

        // Hash the password
        const hashedPassword = await hashPassword(user.password);
        db.users[i].password = hashedPassword;

        console.log(`${colors.green}✓  User ${i + 1}/${db.users.length}: ${userDisplay}${colors.reset}`);
        console.log(`   Original: ${originalPassword}`);
        console.log(`   Hashed:   ${hashedPassword.substring(0, 40)}...`);

        hashedCount++;
      } catch (error) {
        console.error(`${colors.red}❌ User ${i + 1}/${db.users.length}: ${userDisplay} - Error: ${error.message}${colors.reset}`);
        errorCount++;
      }
    }

    // Save updated database
    if (hashedCount > 0) {
      console.log(`\n${colors.cyan}💾 Saving updated database...${colors.reset}`);
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
      console.log(`${colors.green}✓ Database updated successfully${colors.reset}\n`);
    } else {
      console.log(`\n${colors.yellow}⚠  No passwords were hashed. Database not modified.${colors.reset}\n`);
    }

    // Summary
    console.log(`${colors.bright}${colors.blue}========================================${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}  Summary${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}========================================${colors.reset}`);
    console.log(`${colors.green}✓ Hashed:  ${hashedCount} password(s)${colors.reset}`);
    console.log(`${colors.blue}⏭ Skipped: ${skippedCount} password(s) (already hashed)${colors.reset}`);

    if (errorCount > 0) {
      console.log(`${colors.red}❌ Errors:  ${errorCount} user(s)${colors.reset}`);
    }

    console.log(`${colors.bright}${colors.blue}========================================${colors.reset}\n`);

    if (hashedCount > 0) {
      console.log(`${colors.green}${colors.bright}✓ All passwords have been securely hashed!${colors.reset}`);
      console.log(`${colors.cyan}📝 A backup has been saved to: db.json.backup${colors.reset}\n`);
    }

    // Exit with appropriate code
    process.exit(errorCount > 0 ? 1 : 0);

  } catch (error) {
    console.error(`\n${colors.red}${colors.bright}❌ Fatal Error:${colors.reset} ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
hashPasswords();
