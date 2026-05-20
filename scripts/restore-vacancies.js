/**
 * Restore vacancies from backup JSON file.
 * Usage: node scripts/restore-vacancies.js [path-to-backup]
 * Default: reads backup-vacancies.json from project root
 */
require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const Vacancy = require('../models/Vacancy');

const backupPath = process.argv[2] || path.join(__dirname, '..', 'backup-vacancies.json');

async function restore() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set in .env');
    process.exit(1);
  }

  if (!fs.existsSync(backupPath)) {
    console.error(`Backup file not found: ${backupPath}`);
    process.exit(1);
  }

  const vacancies = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
  console.log(`Found ${vacancies.length} vacancies in backup`);

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Ask for confirmation
  const currentCount = await Vacancy.countDocuments();
  console.log(`Current vacancies in DB: ${currentCount}`);

  // Clear existing and insert from backup
  await Vacancy.deleteMany({});
  console.log('Cleared existing vacancies');

  // Remove Mongoose metadata fields, keep _id for consistency
  const cleaned = vacancies.map(v => {
    const { __v, createdAt, updatedAt, ...rest } = v;
    return rest;
  });

  const result = await Vacancy.insertMany(cleaned);
  console.log(`Restored ${result.length} vacancies`);

  await mongoose.disconnect();
  console.log('Done!');
}

restore().catch(err => {
  console.error('Restore failed:', err);
  process.exit(1);
});
