const express = require('express');
const { z } = require('zod');
const Entry = require('../models/Entry');
const verifyToken = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { buildInsights } = require('../utils/analyze');

const router = express.Router();
router.use(verifyToken);

const querySchema = z.object({
  range: z.enum(['7d', '30d']).default('7d'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { range, to } = querySchema.parse(req.query);
    const days = range === '7d' ? 7 : 30;
    const end = new Date(`${to || new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
    const start = new Date(end);
    start.setUTCDate(end.getUTCDate() - (days - 1));

    const entries = await Entry.find({ user: req.user.id, date: { $gte: start, $lte: end } }).lean();

    res.json({
      range,
      entriesLogged: entries.length,
      enough: entries.length >= 3,
      insights: buildInsights(entries, days),
    });
  })
);

module.exports = router;
