const mongoose = require('mongoose');

const smsPassSchema = new mongoose.Schema({
  password: {
    type: String,
    required: true
  }
}, { collection: 'sms_pass' }); // optional: collection name fix

module.exports = mongoose.model('SmsPass', smsPassSchema);
