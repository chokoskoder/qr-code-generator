const qrcode = require('qrcode');
const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();

class QRManager {
  constructor(redisClient) { //service mei initilaise krte redisclient
    this.redis = redisClient;
    this.SECRET =  'I_love_cows_wish_to_be_a_cowherder_someday';
    this.EXPIRY = 600000; // 2 minutes in seconds (was 1200000 milliseconds)
  }

  generateHmac(token) {
    return crypto.createHmac('sha256', this.SECRET).update(token).digest('hex');
  }

  async generateQR(userId) {
    const token = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now();
    const signature = this.generateHmac(token);
    // console.log(`here ${signature,this.EXPIRY}`)
    const data= JSON.stringify({
        userId,
        timestamp,
        signature
      })
    //   console.log(data)÷
    // Fixed Redis setEx usage
    const hey=
    await this.redis.set(`qr:${token}`,data);
    //   console.log(`mlp ${hey}`)
    // Use server IP for local network access
    const baseUrl = `http://localhost:3000`;  // Assuming port 3000
    const qrData = await qrcode.toDataURL(`${baseUrl}/api/qr/verify?token=${token}&sig=${signature}`);

    return {
        userId:userId,
    token: token,
    signature:signature,
    qrData: qrData,
    expiresIn: this.EXPIRY,
    verificationUrl: qrData.toString()
    };
  }

  async verifyQR() {
    const token=(await this.generateQR()).token
    const signature=(await this.generateQR()).signature
    const userId=(await this.generateQR()).userId
    const data = await this.redis.get(`qr:${token}`);
    if (!data) {
      return { valid: false, message: 'QR code expired or invalid' };
    }

    const parsedData = JSON.parse(data);
    const {  timestamp, signature: storedSignature } = parsedData;

    // Check expiration (convert EXPIRY to milliseconds for comparison)
    if (Date.now() - timestamp > this.EXPIRY * 1000*1000000) {
      await this.redis.del(`qr:${token}`);  // Clean up expired token
      return { valid: false, message: 'QR code expired' };
    }

    // if (signature !== storedSignature || signature !== this.generateHmac(token)) {
    //   return { valid: false, message: 'QR code was tampered with' };
    // }

    // Delete token after successful verification
    await this.redis.del(`qr:${token}`);

    return {
      valid: true,
      userId,
      signature,
      message: 'QR code verified successfully'
    };
  }
}

module.exports = {QRManager};