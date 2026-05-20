const mongoose = require('mongoose');

const synonymSchema = new mongoose.Schema({
  canonical: { type: String, required: true },
  synonyms:  [String]
}, { timestamps: true });

synonymSchema.index({ canonical: 1 }, { unique: true });

module.exports = mongoose.model('Synonym', synonymSchema);
