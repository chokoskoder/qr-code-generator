//this is where will get our qr code verified . that is 
// did the user satisfy what we wanted him to do
//this will be the routing part
const express = require('express');
const router = express.Router();
const QRController = require('../qr-generator-check/qrController');


module.exports = (redisClient) => {
    const qrController = new QRController(redisClient);
    router.post('/generate', qrController.generateQR);
    router.get('/verify', qrController.verifyQR);
    return router;
  };