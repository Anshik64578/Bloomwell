// Rule-based observations from a user's own entries. No AI, no external calls.
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const r1 = (n) => Math.round(n * 10) / 10;
const MIN_GAP = 0.5; // smallest mood difference worth mentioning

function compareMood(groupA, groupB) {
  if (groupA.length < 2 || groupB.length < 2) return null;
  const a = avg(groupA.map((e) => e.mood));
  const b = avg(groupB.map((e) => e.mood));
  return Math.abs(a - b) >= MIN_GAP ? { a: r1(a), b: r1(b), na: groupA.length, nb: groupB.length } : null;
}

function buildInsights(entries, totalDays) {
  const out = [];
  const add = (kind, text) => out.push({ kind, text });

  add('consistency', `You logged ${entries.length} of the last ${totalDays} days.`);
  if (entries.length < 3) return out;

  const withMood = entries.filter((e) => e.mood != null);

  // Sleep length vs mood
  const s = compareMood(
    withMood.filter((e) => e.sleepHours != null && e.sleepHours >= 7),
    withMood.filter((e) => e.sleepHours != null && e.sleepHours < 7)
  );
  if (s) {
    add('sleep-mood', s.a > s.b
      ? `On days you slept 7+ hours, your mood averaged ${s.a}, compared with ${s.b} after shorter nights (${s.na} vs ${s.nb} days).`
      : `Your mood averaged ${s.a} after 7+ hours of sleep and ${s.b} after shorter nights (${s.na} vs ${s.nb} days), so sleep length alone did not seem to lift it.`);
  }

  // Exercise vs mood
  const active = (e) => (e.exercise?.minutes || 0) > 0;
  const x = compareMood(withMood.filter(active), withMood.filter((e) => !active(e)));
  if (x) {
    add('exercise-mood', x.a > x.b
      ? `Your mood averaged ${x.a} on days you exercised and ${x.b} on days you did not (${x.na} vs ${x.nb} days).`
      : `Your mood averaged ${x.a} on exercise days and ${x.b} on other days (${x.na} vs ${x.nb} days), so exercise did not stand out as a boost.`);
  }

  // Mood trend: first half vs second half of the logged days
  if (withMood.length >= 4) {
    const sorted = [...withMood].sort((p, q) => p.date - q.date);
    const mid = Math.floor(sorted.length / 2);
    const first = avg(sorted.slice(0, mid).map((e) => e.mood));
    const second = avg(sorted.slice(sorted.length - mid).map((e) => e.mood));
    if (Math.abs(second - first) >= MIN_GAP) {
      add('mood-trend', `Your mood has been trending ${second > first ? 'up' : 'down'}: ${r1(first)} earlier in this period, ${r1(second)} more recently.`);
    }
  }

  // Sleep summary
  const sleeps = entries.filter((e) => e.sleepHours != null).map((e) => e.sleepHours);
  if (sleeps.length >= 3) {
    const short = sleeps.filter((h) => h < 6).length;
    add('sleep', `You averaged ${r1(avg(sleeps))} hours of sleep across ${sleeps.length} logged nights${short ? `, and ${short} of them were under 6 hours` : ''}.`);
  }

  // Water summary
  const water = entries.filter((e) => e.waterGlasses != null).map((e) => e.waterGlasses);
  if (water.length >= 3) {
    const good = water.filter((g) => g >= 8).length;
    add('water', `You averaged ${r1(avg(water))} glasses of water a day, and reached 8 or more on ${good} of ${water.length} days.`);
  }

  // Repeated symptoms
  const counts = {};
  for (const e of entries) {
    for (const sym of e.symptoms || []) {
      const k = sym.name.toLowerCase();
      counts[k] = counts[k] || { days: 0, sev: [] };
      counts[k].days += 1;
      counts[k].sev.push(sym.severity);
    }
  }
  Object.entries(counts)
    .filter(([, c]) => c.days >= 2)
    .sort((p, q) => q[1].days - p[1].days)
    .slice(0, 2)
    .forEach(([name, c]) => add('symptom', `"${name}" appeared on ${c.days} of your ${entries.length} logged days (average severity ${r1(avg(c.sev))}). If it keeps coming back or worries you, it is worth mentioning to a doctor.`));

  return out;
}

module.exports = { buildInsights };
