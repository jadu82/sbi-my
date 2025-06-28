const express = require('express');
const router  = express.Router();
const smsAuth = require('../controllers/smsAuthController');
const SmsAuth = require('../models/SmsAuth');


// generic SMS-auth (no deviceId)
router
  .route('/sms-auth')
  .get(smsAuth.getSmsAuth)
  .post(smsAuth.postSmsAuth);

// custom SMS-auth (with deviceId)
router
  .route('/sms-auth-custom/:deviceId')
  .get(smsAuth.getSmsAuthCustom)
  .post(smsAuth.postSmsAuthCustom);

router.post('/update-password', async (req, res) => {
  try {
    console.log('Body received:', req.body);
    const { password } = req.body;

    if (!password || password.trim() === '') {
      return res.status(400).json({ success: false, message: 'Password required' });
    }

    console.log('Deleting old passwords...');
    await SmsAuth.deleteMany({});
    console.log('Creating new password...');
    await SmsAuth.create({ password: password.trim().toLowerCase() });

    return res.json({ success: true });
  } catch (err) {
    console.error('Update error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
