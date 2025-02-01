const QRManager = require("../qr-generator-check/qrManager");

class QRcontroller {
    constructor(redisClient){
        this.QRManager = new QRManager(redisClient);
    }

    generateQR = async (req, res) => {
        try{
            const { userId} = req.body;
            if(!userId){
                return res.status(400).json({error : 'userId is required'});

            }
            const qrData = await this.QRManager.generateQR(userId);
            return res.status(200).json(qrData);
        }catch(error){
            console.error('QR generation error' , error)
            return res.status(500).json({error : 'failed to generate QR code'});

        }

    }

    verifyQR = async(req , res) =>{
        try{
            const {token , sig} = req.params;
            const result = await this.QRManager.verifyQR(token , sig);

            if(!result.valid){
                return res.status(400).json({error : result.message});
            }
            return res.status(200).json(result);
        }catch(error){
            console.error('qr verification failed , error  ' , error);
            return res.status(500).json({error : 'Failed to verify QR code'});

        }
    }
}

module.exports = QRcontroller;