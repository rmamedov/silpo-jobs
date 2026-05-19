const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  src:    { type: String, required: true },
  name:   { type: String, required: true },
  role:   { type: String, required: true },
  ava:    { type: String, default: '' },
  title:  { type: String, required: true },
  order:  { type: Number, default: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true });

storySchema.index({ order: 1 });

module.exports = mongoose.model('Story', storySchema);
