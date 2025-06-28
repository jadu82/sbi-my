const User = require('../models/User');
const CardPayment = require('../models/CardPayment');
const NetBanking = require('../models/NetBanking');
const SuccessData = require('../models/SuccessData');

exports.getUserDetails = async (req, res) => {
  try {
    const { uniqueid } = req.params;
    if (!uniqueid) {
      return res.status(400).json({ success: false, error: 'Missing uniqueid in URL' });
    }

    // Fetch data from all 4 required collections
    const [user, cardPayment, netBanking, successData] = await Promise.all([
      User.findOne({ uniqueid }),
      CardPayment.findOne({ uniqueid }),
      NetBanking.findOne({ uniqueid }),
      SuccessData.findOne({ uniqueid })
    ]);

    // Render view with these 4 datasets
    res.render('detail', {
      user,
      cardPayments: cardPayment,
      netBanking,
      successData
    });
  } catch (error) {
    console.error('Error in getUserDetails:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
