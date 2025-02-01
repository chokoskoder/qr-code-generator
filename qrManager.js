const qrcode = require('qrcode');
const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();

class QRManager {
  constructor(redisClient) {
    this.redis = redisClient;
    this.SECRET = process.env.QR_SECRET || 'I_love_cows_wish_to_be_a_cowherder_someday';
    this.EXPIRY = 12000; // 2 minutes in seconds (was 1200000 milliseconds)
  }

  generateHmac(token) {
    return crypto.createHmac('sha256', this.SECRET).update(token).digest('hex');
  }

  async generateQR(userId) {
    const token = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now();
    const signature = this.generateHmac(token);

    // Fixed Redis setEx usage
    await this.redis.setEx(
      `qr:${token}`,
      this.EXPIRY,  // expiry in seconds
      JSON.stringify({
        userId,
        timestamp,
        signature
      })
    );

    // Use server IP for local network access
    const baseUrl = `http://localhost:3000`;  // Assuming port 3000
    const qrData = await qrcode.toDataURL(`${baseUrl}/api/qr/verify?token=${token}&sig=${signature}`);

    return {
      token,
      qrData,
      expiresIn: this.EXPIRY,
      verificationUrl: `${baseUrl}/api/qr/verify?token=${token}&sig=${signature}`  // Added for debugging
    };
  }

  async verifyQR(token, signature) {
    const data = await this.redis.get(`qr:${token}`);
    if (!data) {
      return { valid: false, message: 'QR code expired or invalid' };
    }

    const parsedData = JSON.parse(data);
    const { userId, timestamp, signature: storedSignature } = parsedData;

    // Check expiration (convert EXPIRY to milliseconds for comparison)
    if (Date.now() - timestamp > this.EXPIRY * 1000) {
      await this.redis.del(`qr:${token}`);  // Clean up expired token
      return { valid: false, message: 'QR code expired' };
    }

    if (signature !== storedSignature || signature !== this.generateHmac(token)) {
      return { valid: false, message: 'QR code was tampered with' };
    }

    // Delete token after successful verification
    await this.redis.del(`qr:${token}`);

    return {
      valid: true,
      userId,
      message: 'QR code verified successfully'
    };
  }
}

module.exports = QRManager;