const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  vacancyId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Vacancy', default: null },
  vacancyTitle:      { type: String, default: 'Загальна заявка' },
  name:              { type: String, required: true },
  phone:             { type: String, required: true },
  workplace:         { type: String, default: '' },
  city:              { type: String, default: '' },
  position:          { type: String, default: '' },
  resumePath:        { type: String, default: '' },
  resumeOriginalName:{ type: String, default: '' },
  comment:           { type: String, default: '' },
  source:            { type: String, default: 'website' },
  status:            { type: String, enum: ['new', 'reviewed', 'contacted', 'rejected', 'hired'], default: 'new' },
  notes:             { type: String, default: '' }
}, { timestamps: true });

applicationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);
