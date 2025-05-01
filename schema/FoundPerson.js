const mongoose = require('mongoose'); // ✅ Import actual mongoose
require('../db/db'); 

const foundPersonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true }, // stores the image path or filename
  age: { type: Number, required: true },
  location: { type: String, required: true },
  contact: { type: String, required: true },
  faceDescriptor: { type: [Number], default: [] }, // required for face matching
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FoundPerson', foundPersonSchema);
