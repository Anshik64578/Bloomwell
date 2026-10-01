import { useEffect, useState } from 'react';
import { api } from './api.js';

const MOODS = [['😞', 'Very low'], ['🙁', 'Low'], ['😐', 'Okay'], ['🙂', 'Good'], ['😄', 'Great']];
const today = () => new Date().toLocaleDateString('en-CA');
const blank = () => ({ date: today(), mood: 0, sleepHours: '', waterGlasses: 0, exType: '', exMinutes: '', symptoms: [], notes: '' });
const num = (v) => (v === '' || v == null ? undefined : Number(v));

export default function Journal({ session, onLogout }) {
  const { token, user } = session;
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState(blank());
  const [editId, setEditId] = useState(null);
  const [sym, setSym] = useState({ name: '', severity: 1 });
  const [msg, setMsg] = useState({ text: '', bad: false });

  const load = () => api('/entries', { token }).then(setEntries).catch((e) => {
    if (e.status === 401) onLogout(); else setMsg({ text: e.message, bad: true });
  });
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function addSymptom() {
    const name = sym.name.trim();
    if (!name) return;
    set('symptoms', [...form.symptoms, { name, severity: Number(sym.severity) }]);
    setSym({ name: '', severity: 1 });
  }

  async function save(e) {
    e.preventDefault();
    const body = {
      date: form.date,
      mood: form.mood || undefined,
      sleepHours: num(form.sleepHours),
      waterGlasses: form.waterGlasses,
      symptoms: form.symptoms,
      exercise: form.exType || form.exMinutes !== '' ? { type: form.exType || undefined, minutes: num(form.exMinutes) } : undefined,
      notes: form.notes || undefined,
    };
    try {
      await api(editId ? `/entries/${editId}` : '/entries', { method: editId ? 'PUT' : 'POST', body, token });
      setMsg({ text: editId ? 'Entry updated' : 'Entry saved', bad: false });
      setForm(blank()); setEditId(null); load();
    } catch (err) {
      setMsg({ text: err.status === 409 ? 'You already logged this date. Pick it from your history to edit it.' : err.message, bad: true });
    }
  }

  function edit(en) {
    setEditId(en._id);
    setForm({
      date: en.date.slice(0, 10), mood: en.mood || 0, sleepHours: en.sleepHours ?? '', waterGlasses: en.waterGlasses ?? 0,
      exType: en.exercise?.type || '', exMinutes: en.exercise?.minutes ?? '', symptoms: en.symptoms || [], notes: en.notes || '',
    });
    setMsg({ text: '', bad: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function remove(id) {
    if (!confirm('Delete this entry?')) return;
    await api(`/entries/${id}`, { method: 'DELETE', token }).catch((e) => setMsg({ text: e.message, bad: true }));
    if (editId === id) { setEditId(null); setForm(blank()); }
    load();
  }

  return (
    <>
      <div className="grid">
        <form className="panel" onSubmit={save}>
          <h2>{editId ? 'Edit entry' : 'How are you today?'}</h2>

          <label>Date<input type="date" value={form.date} max={today()} onChange={(e) => set('date', e.target.value)} required /></label>

          <fieldset>
            <legend>Mood</legend>
            <div className="moods">
              {MOODS.map(([face, label], i) => (
                <button type="button" key={label} className={form.mood === i + 1 ? 'mood on' : 'mood'}
                  aria-label={label} aria-pressed={form.mood === i + 1} title={label}
                  onClick={() => set('mood', form.mood === i + 1 ? 0 : i + 1)}>{face}</button>
              ))}
            </div>
          </fieldset>

          <div className="row">
            <label>Sleep (hours)<input type="number" min="0" max="24" step="0.5" value={form.sleepHours} onChange={(e) => set('sleepHours', e.target.value)} /></label>
            <label>Water (glasses)
              <div className="stepper">
                <button type="button" aria-label="Fewer glasses" onClick={() => set('waterGlasses', Math.max(0, form.waterGlasses - 1))}>-</button>
                <output>{form.waterGlasses}</output>
                <button type="button" aria-label="More glasses" onClick={() => set('waterGlasses', Math.min(50, form.waterGlasses + 1))}>+</button>
              </div>
            </label>
          </div>

          <div className="row">
            <label>Exercise<input placeholder="e.g. walking" maxLength={50} value={form.exType} onChange={(e) => set('exType', e.target.value)} /></label>
            <label>Minutes<input type="number" min="0" max="600" value={form.exMinutes} onChange={(e) => set('exMinutes', e.target.value)} /></label>
          </div>

          <fieldset>
            <legend>Symptoms</legend>
            <div className="row add">
              <input placeholder="e.g. headache" maxLength={50} value={sym.name} aria-label="Symptom name"
                onChange={(e) => setSym({ ...sym, name: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSymptom(); } }} />
              <select value={sym.severity} aria-label="Severity" onChange={(e) => setSym({ ...sym, severity: e.target.value })}>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>Severity {n}</option>)}
              </select>
              <button type="button" onClick={addSymptom}>Add</button>
            </div>
            <div className="chips">
              {form.symptoms.map((s, i) => (
                <span className="chip" key={i}>{s.name} ({s.severity})
                  <button type="button" aria-label={`Remove ${s.name}`} onClick={() => set('symptoms', form.symptoms.filter((_, j) => j !== i))}>×</button>
                </span>
              ))}
            </div>
          </fieldset>

          <label>Notes<textarea rows="3" maxLength={2000} value={form.notes} onChange={(e) => set('notes', e.target.value)} /></label>

          {msg.text && <p className={msg.bad ? 'error' : 'ok'} role="status">{msg.text}</p>}
          <div className="row">
            <button className="primary">{editId ? 'Update entry' : 'Save entry'}</button>
            {editId && <button type="button" onClick={() => { setEditId(null); setForm(blank()); }}>Cancel</button>}
          </div>
        </form>

        <section>
          <h2>History</h2>
          {entries.length === 0 && <p className="muted">No entries yet. Save your first one and it will show up here.</p>}
          <ul className="history">
            {entries.map((en) => (
              <li key={en._id} className="panel">
                <div className="top">
                  <strong>{new Date(en.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}</strong>
                  <span className="face">{en.mood ? MOODS[en.mood - 1][0] : ''}</span>
                </div>
                <p className="stats">
                  {en.sleepHours != null && `Sleep ${en.sleepHours}h`}
                  {en.waterGlasses != null && `  Water ${en.waterGlasses}`}
                  {en.exercise?.minutes != null && `  ${en.exercise.type || 'Exercise'} ${en.exercise.minutes}m`}
                </p>
                {en.symptoms?.length > 0 && <p className="stats">Symptoms: {en.symptoms.map((s) => `${s.name} (${s.severity})`).join(', ')}</p>}
                {en.notes && <p className="notes">{en.notes}</p>}
                <div className="row"><button onClick={() => edit(en)}>Edit</button><button className="danger" onClick={() => remove(en._id)}>Delete</button></div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
