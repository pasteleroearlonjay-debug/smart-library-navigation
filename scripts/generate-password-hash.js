/**
 * Script to generate bcrypt password hashes for admin users
 * Usage: node scripts/generate-password-hash.js <password>
 * Example: node scripts/generate-password-hash.js admin123
 */

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/generate-password-hash.js <password>');
  console.error('Example: node scripts/generate-password-hash.js admin123');
  process.exit(1);
}

async function generateHash() {
  try {
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    
    console.log('\n========================================');
    console.log('Password Hash Generated');
    console.log('========================================');
    console.log(`Password: ${password}`);
    console.log(`Hash: ${hash}`);
    console.log('\nSQL INSERT statement:');
    console.log(`'${hash}'`);
    console.log('\n========================================\n');
    
    // Verify the hash works
    const isValid = await bcrypt.compare(password, hash);
    console.log(`Verification: ${isValid ? '✓ Hash is valid' : '✗ Hash verification failed'}\n`);
  } catch (error) {
    console.error('Error generating hash:', error);
    process.exit(1);
  }
}

generateHash();

