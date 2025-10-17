const crypto = require('crypto');

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

// Ensure encryption key is properly formatted (32 bytes for AES-256)
const getKey = () => {
  if (ENCRYPTION_KEY.length === 64) {
    // Hex string (32 bytes)
    return Buffer.from(ENCRYPTION_KEY, 'hex');
  } else if (ENCRYPTION_KEY.length === 32) {
    // Direct 32-byte string
    return Buffer.from(ENCRYPTION_KEY);
  } else {
    // Generate from existing key
    return crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  }
};

/**
 * Encrypt sensitive data (API tokens, secrets)
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text with IV and auth tag (format: iv:encrypted:authTag)
 */
function encrypt(text) {
  if (!text) {
    throw new Error('Text to encrypt cannot be empty');
  }

  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return format: iv:encrypted:authTag
    return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
  } catch (error) {
    console.error('Encryption error:', error.message);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt encrypted data
 * @param {string} encryptedData - Encrypted string (format: iv:encrypted:authTag)
 * @returns {string} - Decrypted plain text
 */
function decrypt(encryptedData) {
  if (!encryptedData) {
    throw new Error('Encrypted data cannot be empty');
  }

  try {
    const parts = encryptedData.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const authTag = Buffer.from(parts[2], 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Mask sensitive data for display (show first 8 and last 4 characters)
 * @param {string} text - Text to mask
 * @returns {string} - Masked text
 */
function maskToken(text) {
  if (!text || text.length < 13) {
    return '***********';
  }
  return `${text.substring(0, 8)}...${text.substring(text.length - 4)}`;
}

/**
 * Generate a secure random token
 * @param {number} length - Token length in bytes (default 32)
 * @returns {string} - Random hex token
 */
function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash data using SHA-256
 * @param {string} data - Data to hash
 * @returns {string} - Hash hex string
 */
function hash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Validate encryption key configuration
 * @returns {boolean} - True if encryption is properly configured
 */
function validateEncryptionSetup() {
  try {
    const testData = 'test-encryption-' + Date.now();
    const encrypted = encrypt(testData);
    const decrypted = decrypt(encrypted);
    return decrypted === testData;
  } catch (error) {
    console.error('Encryption validation failed:', error.message);
    return false;
  }
}

// Log warning if using default encryption key (in development only)
if (!process.env.ENCRYPTION_KEY && process.env.NODE_ENV !== 'production') {
  console.warn('⚠️  WARNING: Using default encryption key. Set ENCRYPTION_KEY in .env for production!');
  console.warn('   Generate key with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
}

module.exports = {
  encrypt,
  decrypt,
  maskToken,
  generateToken,
  hash,
  validateEncryptionSetup
};
