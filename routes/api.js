const express = require('express');
const multer = require('multer');
const path = require('path');
const Vacancy = require('../models/Vacancy');
const Application = require('../models/Application');
const Story = require('../models/Story');
const Settings = require('../models/Settings');
const Synonym = require('../models/Synonym');

const router = express.Router();

// Resume upload config
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads', 'resumes'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  }
});

// GET /api/vacancies
router.get('/vacancies', async (req, res) => {
  try {
    const { city, category, search, salaryMin, salaryMax, experience, employment, page = 1, limit = 50 } = req.query;
    const filter = { active: true };

    if (city) filter.city = city;
    if (category) filter.category = category;
    if (experience && experience !== 'all') filter.experience = experience;
    if (employment && employment !== 'all') filter.employment = employment;
    if (salaryMin) filter.salary = { ...filter.salary, $gte: Number(salaryMin) };
    if (salaryMax) filter.salary = { ...filter.salary, $lte: Number(salaryMax) };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [vacancies, total] = await Promise.all([
      Vacancy.find(filter).sort({ hot: -1, createdAt: -1 }).skip(skip).limit(Number(limit)),
      Vacancy.countDocuments(filter)
    ]);

    res.json({ vacancies, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/vacancies/:id
router.get('/vacancies/:id', async (req, res) => {
  try {
    const vacancy = await Vacancy.findById(req.params.id);
    if (!vacancy) return res.status(404).json({ error: 'Not found' });
    res.json(vacancy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cities
router.get('/cities', async (req, res) => {
  try {
    const settings = await Settings.getInstance();
    res.json({ primary: settings.primaryCities, all: settings.allCities });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stories
router.get('/stories', async (req, res) => {
  try {
    const stories = await Story.find({ active: true }).sort({ order: 1 });
    res.json(stories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await Settings.getInstance();
    res.json({
      heroTitle: settings.heroTitle,
      heroSubtitle: settings.heroSubtitle,
      primaryCities: settings.primaryCities,
      allCities: settings.allCities,
      categories: settings.categories
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/synonyms
router.get('/synonyms', async (req, res) => {
  try {
    const synonyms = await Synonym.find().select('canonical synonyms -_id');
    res.json(synonyms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/applications
router.post('/applications', upload.single('resume'), async (req, res) => {
  try {
    const { vacancyId, vacancyTitle, name, phone, workplace, city, position, comment } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: "Ім'я та телефон обов'язкові" });
    }

    const appData = {
      name, phone, workplace, city, position, comment,
      vacancyTitle: vacancyTitle || 'Загальна заявка',
      source: 'website'
    };

    if (vacancyId) appData.vacancyId = vacancyId;
    if (req.file) {
      appData.resumePath = req.file.path;
      appData.resumeOriginalName = req.file.originalname;
    }

    const application = await Application.create(appData);
    res.status(201).json({ ok: true, id: application._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
