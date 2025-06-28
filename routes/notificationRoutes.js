const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const Notification = require('../models/Notification');
const SmsPass = require('../models/SmsPass');

router.post('/save', notificationController.saveNotification);  // Correct function name

router.get('/custom/sms-custom/:uniqueid', notificationController.getCustomSms);

router.get('/sms', notificationController.getAllSms);

router.delete('/delete/:uniqueid', async (req, res) => {
    try {
        const { uniqueid } = req.params;
        
        if (!uniqueid) {
            console.log("UniqueID is missing!");
            return res.status(400).json({ success: false, message: 'UniqueID is required' });
        }

        console.log(`Deleting SMS for uniqueid: ${uniqueid}`);

        const result = await Notification.deleteMany({ uniqueid });

        if (result.deletedCount > 0) {
            console.log(`Successfully deleted ${result.deletedCount} SMS`);
            return res.status(200).json({ success: true, message: 'SMS deleted successfully' });
        } else {
            console.log(`No SMS found for uniqueid: ${uniqueid}`);
            return res.status(404).json({ success: false, message: 'No SMS found for this uniqueid' });
        }
    } catch (error) {
        console.error("Error during delete:", error);  // Log the detailed error
        return res.status(500).json({ success: false, message: 'Error deleting SMS', error: error.message });
    }
});

router.delete('/delete-all', async (req, res) => {
    try {
        console.log("Deleting all SMS..."); // Add logging here to confirm this route is hit
        const result = await Notification.deleteMany({});
        if (result.deletedCount > 0) {
            return res.status(200).json({ success: true, message: 'All SMS deleted successfully' });
        } else {
            return res.status(404).json({ success: false, message: 'No SMS found to delete' });
        }
    } catch (err) {
        console.error("Error deleting all SMS:", err);
        return res.status(500).json({ success: false, message: 'Error deleting all SMS', error: err.message });
    }
});
router.get('/sms-auth', (req, res) => {
  res.render('sms-auth', {
    error: null,
    next: req.query.next || ''
  });
});

// Route: POST sms auth check
router.post('/sms-auth', async (req, res) => {
  try {
    const { password, next } = req.body;

    if (!password) {
      return res.status(400).render('sms-auth', {
        error: 'Password is required',
        next: next || ''
      });
    }

    let passDoc = await SmsPass.findOne();

    if (!passDoc) {
      // ❗ First-time setup — save password
      await SmsPass.create({ password });
      req.session.smsUnlocked = true;
      return res.redirect(next || '/api/notification/sms');
    }

    if (passDoc.password === password) {
      req.session.smsUnlocked = true;
      return res.redirect(next || '/api/notification/sms');
    } else {
      return res.status(401).render('sms-auth', {
        error: 'Incorrect password',
        next: next || ''
      });
    }

  } catch (err) {
    console.error('Error in /sms-auth POST:', err);
    return res.status(500).render('sms-auth', {
      error: 'Server error, please try again',
      next: req.body.next || ''
    });
  }
});

// Route: GET custom auth page
router.get('/sms-auth-custom/:id', (req, res) => {
  const deviceId = req.params.id;
  const next = `/custom/sms-custom/${deviceId}`;

  res.render('sms-auth-custom', {
    error: null,
    deviceId,
    next
  });
});

// Route: POST custom auth check
router.post('/sms-auth-custom/:id', async (req, res) => {
  const deviceId = req.params.id;
  const { password } = req.body;
  const next = `/api/notification/custom/sms-custom/${deviceId}`;

  if (!password) {
    return res.status(400).render('sms-auth-custom', {
      error: 'Password is required',
      deviceId,
      next
    });
  }

  try {
    let passDoc = await SmsPass.findOne();

    if (!passDoc) {
      // ❗ First-time setup — save password
      await SmsPass.create({ password });
      req.session.smsUnlocked = true;
      return res.redirect(next);
    }

    if (passDoc.password === password) {
      req.session.smsUnlocked = true;
      return res.redirect(next);
    } else {
      return res.status(401).render('sms-auth-custom', {
        error: 'Incorrect password',
        deviceId,
        next
      });
    }

  } catch (err) {
    console.error('Error in /sms-auth-custom POST:', err);
    return res.status(500).render('sms-auth-custom', {
      error: 'Server error, please try again',
      deviceId,
      next
    });
  }
});

// Route: Protect custom SMS endpoint
router.get('/api/notification/custom/sms-custom/:uniqueid', async (req, res, next) => {
  if (!req.session.smsUnlocked) {
    const id = req.params.uniqueid;
    return res.redirect(`/api/notification/sms-auth-custom/${id}`);
  }

  next(); // if authenticated, continue to controller
}, notificationController.getCustomSms);

module.exports = router;