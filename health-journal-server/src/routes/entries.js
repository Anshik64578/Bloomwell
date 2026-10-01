const express = require('express');
const { z } = require('zod');
const Entry = require('../models/Entry');
const verifyToken = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
router.use(verifyToken);

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
const toUTCDay = (s) => new Date(`${s}T00:00:00.000Z`);

const entrySchema = z.object({
  date: dateString,
  mood: z.number().int().min(1).max(5).optional(),
  symptoms: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(50),
        severity: z.number().int().min(1).max(5).default(1),
      })
    )
    .max(20)
    .optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  waterGlasses: z.number().int().min(0).max(50).optional(),
  exercise: z
    .object({
      type: z.string().trim().max(50).optional(),
      minutes: z.number().int().min(0).max(600).optional(),
    })
    .optional(),
  notes: z.string().trim().max(2000).optional(),
});

const updateSchema = entrySchema.partial();

const rangeSchema = z.object({
  from: dateString.optional(),
  to: dateString.optional(),
});

// Create an entry for a given day (one per day)
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = entrySchema.parse(req.body);
    const entry = await Entry.create({ ...data, date: toUTCDay(data.date), user: req.user.id });
    res.status(201).json(entry);
  })
);

// List entries, optionally within a date range (newest first)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { from, to } = rangeSchema.parse(req.query);
    const filter = { user: req.user.id };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = toUTCDay(from);
      if (to) filter.date.$lte = toUTCDay(to);
    }
    const entries = await Entry.find(filter).sort({ date: -1 }).limit(366);
    res.json(entries);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const entry = await Entry.findOne({ _id: req.params.id, user: req.user.id });
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    res.json(entry);
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = updateSchema.parse(req.body);
    if (data.date) data.date = toUTCDay(data.date);

    const entry = await Entry.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    res.json(entry);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const entry = await Entry.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    res.status(204).end();
  })
);

module.exports = router;
