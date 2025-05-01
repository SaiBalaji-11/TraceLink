const mongoose = require('mongoose'); // ✅ Import actual mongoose
require('../db/db'); // ✅ Ensure DB connection is established

const lostPersonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  age: { type: Number, required: true },
  lostLocation: { type: String, required: true },
  reward: { type: String },
  contact: { type: String, required: true },
  address: { type: String, required: true },
  faceDescriptor: { type: [Number], default: [] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LostPerson', lostPersonSchema);
