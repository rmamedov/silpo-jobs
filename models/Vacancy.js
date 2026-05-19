const mongoose = require('mongoose');

const vacancySchema = new mongoose.Schema({
  title:        { type: String, required: true },
  location:     { type: String, required: true },
  address:      { type: String, default: '' },
  category:     { type: String, enum: ['Магазин', 'Склад', 'Офіс', "Кур'єр"], required: true },
  hot:          { type: Boolean, default: false },
  employment:   { type: String, default: 'Повна' },
  experience:   { type: String, default: 'none' },
  salary:       { type: Number, default: 0 },
  schedule:     { type: String, default: '' },
  city:         { type: String, required: true },
  tags:         [String],
  date:         { type: String, default: () => new Date().toISOString().slice(0, 10) },
  duties:       [String],
  requirements: [String],
  offers:       [String],
  active:       { type: Boolean, default: true },
  legacyId:     { type: Number }
}, { timestamps: true });

vacancySchema.index({ city: 1, category: 1, active: 1 });
vacancySchema.index({ title: 'text', location: 'text' });

module.exports = mongoose.model('Vacancy', vacancySchema);
