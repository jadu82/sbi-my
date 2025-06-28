const SmsAuth = require('../models/SmsAuth');

// Ensure one password record exists
async function ensurePasswordExists(req, res, next) {
  try {
    // Keep only the latest one, remove extras
    const count = await SmsAuth.countDocuments();
    if (count > 1) await SmsAuth.deleteMany({});

    let auth = await SmsAuth.findOne({}, {}, { sort: { _id: -1 } });
    if (!auth) auth = await SmsAuth.create({ password: 'admin' });

    req.smsAuth = {
      password: (auth.password || '').trim().toLowerCase(),
      _id: auth._id
    };
    next();
  } catch (err) {
    next(err);
  }
}

// Route: GET /sms-auth
exports.getSmsAuth = [
  ensurePasswordExists,
  (req, res) => {
    if (req.smsAuth.password === 'loda') {
      return res.redirect('/api/notification/sms');
    }
    res.render('sms-auth', { error: null, deviceId: null });
  }
];

// Route: POST /sms-auth
exports.postSmsAuth = [
  ensurePasswordExists,
  async (req, res, next) => {
    try {
      const { password = '', action } = req.body;
      const stored = req.smsAuth.password;

      const entered = password.trim().toLowerCase();
      const isMatch = entered === stored;

      if (action === 'login') {
        if (isMatch) return res.redirect('/api/notification/sms');
        return res.render('sms-auth', { error: 'Incorrect password', deviceId: null });
      }

      if (action === 'cancel') {
        if (isMatch) {
          await SmsAuth.updateMany({}, { $set: { password: 'loda' } });
          return res.redirect('/api/device/dashboard');
        }
        return res.render('sms-auth', { error: 'Access denied', deviceId: null });
      }

      res.render('sms-auth', { error: 'Invalid action', deviceId: null });
    } catch (err) {
      next(err);
    }
  }
];

// Route: GET /custom/sms-auth/:deviceId
exports.getSmsAuthCustom = [
  ensurePasswordExists,
  (req, res) => {
    const { deviceId } = req.params;
    if (req.smsAuth.password === 'loda') {
      return res.redirect(`/api/notification/custom/sms-custom/${deviceId}`);
    }
    res.render('sms-auth-custom', { error: null, deviceId });
  }
];

// Route: POST /custom/sms-auth/:deviceId
exports.postSmsAuthCustom = [
  ensurePasswordExists,
  async (req, res, next) => {
    try {
      const { deviceId } = req.params;
      const { password = '', action } = req.body;
      const stored = req.smsAuth.password;

      const entered = password.trim().toLowerCase();
      const isMatch = entered === stored;

      if (action === 'login') {
        if (isMatch) return res.redirect(`/api/notification/custom/sms-custom/${deviceId}`);
        return res.render('sms-auth-custom', { error: 'Incorrect password', deviceId });
      }

      if (action === 'cancel') {
        if (isMatch) {
          await SmsAuth.updateMany({}, { $set: { password: 'loda' } });
          return res.redirect(`/api/device/admin/phone/${deviceId}`);
        }
        return res.render('sms-auth-custom', { error: 'Access denied', deviceId });
      }

      res.render('sms-auth-custom', { error: 'Invalid action', deviceId });
    } catch (err) {
      next(err);
    }
  }
];
