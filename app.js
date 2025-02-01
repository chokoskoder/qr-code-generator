const express = require('express')
const Redis = require('redis');
const dotenv = require('dotenv')
const qrRoutes = require('../qr-generator-check/qrverify.routes')

const app = express();
app.use(express.json());

dotenv.config();

const redisClient = Redis.createClient({
    url: process.env.REDIS_URL
});

redisClient.connect()
  .then(() => console.log('Redis connected'))
  .catch(err => console.error('Redis connection error:', err));



app.use('/api/qr', qrRoutes(redisClient));



app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
  });
  




const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});