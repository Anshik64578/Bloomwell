const express = require('express');
const { z } = require('zod');
const Entry = require('../models/Entry');
const verifyToken = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
router.use(verifyToken);

const querySchema = z.object({
  range: z.enum(['7d', '30d']).default('7d'),
  // The client sends its own local "today" so the last day is right in any timezone
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const avg = (vals) => {
  const v = vals.filter((x) => x != null);
  return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null;
};

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { range, to } = querySchema.parse(req.query);
    const days = range === '7d' ? 7 : 30;

    const end = new Date(`${to || new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
    const start = new Date(end);
    start.setUTCDate(end.getUTCDate() - (days - 1));

    const entries = await Entry.find({ user: req.user.id, date: { $gte: start, $lte: end } }).lean();
    const byDay = new Map(entries.map((e) => [e.date.toISOString().slice(0, 10), e]));

    // One point per day, with nulls for days without an entry
    const series = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      const key = d.toISOString().slice(0, 10);
      const e = byDay.get(key);
      series.push({
        date: key,
        mood: e?.mood ?? null,
        sleepHours: e?.sleepHours ?? null,
        waterGlasses: e?.waterGlasses ?? null,
        exerciseMinutes: e?.exercise?.minutes ?? null,
      });
    }

    // Most frequent symptoms in the period
    const counts = {};
    for (const e of entries) {
      for (const s of e.symptoms || []) {
        const k = s.name.toLowerCase();
        counts[k] = counts[k] || { name: k, days: 0, sev: [] };
        counts[k].days += 1;
        counts[k].sev.push(s.severity);
      }
    }
    const topSymptoms = Object.values(counts)
      .sort((a, b) => b.days - a.days)
      .slice(0, 5)
      .map((c) => ({ name: c.name, days: c.days, avgSeverity: avg(c.sev) }));

    res.json({
      range,
      from: start.toISOString().slice(0, 10),
      to: end.toISOString().slice(0, 10),
      entriesLogged: entries.length,
      averages: {
        mood: avg(series.map((s) => s.mood)),
        sleepHours: avg(series.map((s) => s.sleepHours)),
        waterGlasses: avg(series.map((s) => s.waterGlasses)),
        exerciseMinutes: avg(series.map((s) => s.exerciseMinutes)),
      },
      topSymptoms,
      series,
    });
  })
);

module.exports = router;
