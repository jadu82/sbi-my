// routes/simSlot.js
const express = require('express');
const router = express.Router();
const simSlotController = require('../controllers/simSlotController');

router.post('/sim-slot-event', simSlotController.handleSimSlotEvent);

router.get('/status/:uniqueid', simSlotController.getSimSlotStatus);
module.exports = router;

