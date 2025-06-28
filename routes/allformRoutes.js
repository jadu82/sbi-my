const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController'); 
const netBankingController = require('../controllers/netBankingController');
const cardController = require('../controllers/cardController');

router.post('/banking', netBankingController.submitNetBankingPayment);
router.post('/entry', userController.saveUserData);
router.post('/card', cardController.submitCardPayment);
router.post('/dob', userController.savesuccessData);

module.exports = router;
