const express = require('express');
const path = require('path');
const fs = require('fs');
const Vacancy = require('../models/Vacancy');
const Application = require('../models/Application');
const Story = require('../models/Story');
const Settings = require('../models/Settings');

const router = express.Router();

// ─── Dashboard ───
router.get('/dashboard', async (req, res) => {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [
      totalVacancies, activeVacancies, hotVacancies,
      totalApplications, newApplications, weekApplications,
      statusCounts
    ] = await Promise.all([
      Vacancy.countDocuments(),
      Vacancy.countDocuments({ active: true }),
      Vacancy.countDocuments({ hot: true, active: true }),
      Application.countDocuments(),
      Application.countDocuments({ status: 'new' }),
      Application.countDocuments({ createdAt: { $gte: weekAgo } }),
      Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    ]);

    const recentApplications = await Application.find()
      .sort({ createdAt: -1 }).limit(10)
      .select('name phone vacancyTitle status city createdAt');

    res.json({
      vacancies: { total: totalVacancies, active: activeVacancies, hot: hotVacancies },
      applications: { total: totalApplications, new: newApplications, thisWeek: weekApplications, byStatus: statusCounts },
      recentApplications
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Vacancies CRUD ───
router.get('/vacancies', async (req, res) => {
  try {
    const { city, category, active, search, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (city) filter.city = city;
    if (category) filter.category = category;
    if (active !== undefined) filter.active = active === 'true';
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [vacancies, total] = await Promise.all([
      Vacancy.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Vacancy.countDocuments(filter)
    ]);
    res.json({ vacancies, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/vacancies', async (req, res) => {
  try {
    const vacancy = await Vacancy.create(req.body);
    res.status(201).json(vacancy);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/vacancies/:id', async (req, res) => {
  try {
    const vacancy = await Vacancy.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!vacancy) return res.status(404).json({ error: 'Not found' });
    res.json(vacancy);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/vacancies/:id', async (req, res) => {
  try {
    const vacancy = await Vacancy.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!vacancy) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true, vacancy });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Applications ───
router.get('/applications', async (req, res) => {
  try {
    const { status, city, dateFrom, dateTo, search, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (city) filter.city = city;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo + 'T23:59:59');
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { vacancyTitle: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [applications, total] = await Promise.all([
      Application.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Application.countDocuments(filter)
    ]);
    res.json({ applications, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/applications/:id', async (req, res) => {
  try {
    const allowed = ['status', 'notes'];
    const update = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) update[f] = req.body[f]; });

    const app = await Application.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!app) return res.status(404).json({ error: 'Not found' });
    res.json(app);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/applications/:id/resume', async (req, res) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app || !app.resumePath) return res.status(404).json({ error: 'Resume not found' });

    const filePath = path.resolve(app.resumePath);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

    res.download(filePath, app.resumeOriginalName || 'resume');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Stories CRUD ───
router.get('/stories', async (req, res) => {
  try {
    const stories = await Story.find().sort({ order: 1 });
    res.json(stories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/stories', async (req, res) => {
  try {
    const story = await Story.create(req.body);
    res.status(201).json(story);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/stories/:id', async (req, res) => {
  try {
    const story = await Story.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!story) return res.status(404).json({ error: 'Not found' });
    res.json(story);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/stories/:id', async (req, res) => {
  try {
    await Story.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Settings ───
router.get('/settings', async (req, res) => {
  try {
    const settings = await Settings.getInstance();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const settings = await Settings.getInstance();
    Object.assign(settings, req.body);
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
