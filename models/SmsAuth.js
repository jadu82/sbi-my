const mongoose = require('mongoose');

const smsAuthSchema = new mongoose.Schema({
  password: { type: String, required: true }
}, {
  collection: 'smsAuth',
  capped: { size: 1024, max: 1, autoIndexId: true }
});

module.exports = mongoose.model('SmsAuth', smsAuthSchema);
