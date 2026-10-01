import { useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { api } from './api.js';

const TEAL = '#c93a55';
const SUN = '#e0a92c';
const today = () => new Date().toLocaleDateString('en-CA');
const shortDate = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' });

function Card({ title, avg, unit, children }) {
  return (
    <div className="panel">
      <div className="top"><h3>{title}</h3><span className="muted">{avg != null ? `Average ${avg}${unit}` : 'No data yet'}</span></div>
      <div className="chart">{children}</div>
    </div>
  );
}

const axes = (yProps) => (
  <>
    <CartesianGrid stroke="#ecdde1" vertical={false} />
    <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={24} tick={{ fontSize: 12 }} />
    <YAxis width={32} tick={{ fontSize: 12 }} allowDecimals={false} {...yProps} />
    <Tooltip labelFormatter={shortDate} />
  </>
);

export default function Trends({ token, onUnauthorized }) {
  const [range, setRange] = useState('7d');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    api(`/stats?range=${range}&to=${today()}`, { token }).then(setData).catch((e) => {
      if (e.status === 401) onUnauthorized(); else setError(e.message);
    });
  }, [range]);

  if (error) return <p className="error" role="alert">{error}</p>;
  if (!data) return <p className="muted">Loading your trends</p>;

  const { series, averages: a } = data;

  return (
    <section>
      <div className="top">
        <h2>Your trends</h2>
        <div className="tabs" role="group" aria-label="Time range">
          <button className={range === '7d' ? 'on' : ''} onClick={() => setRange('7d')}>Last 7 days</button>
          <button className={range === '30d' ? 'on' : ''} onClick={() => setRange('30d')}>Last 30 days</button>
        </div>
      </div>

      {data.entriesLogged === 0 ? (
        <p className="muted">No entries in this period. Log a day in the Journal tab and your charts will appear here.</p>
      ) : (
        <>
          <p className="muted">You logged {data.entriesLogged} of {series.length} days.</p>
          <div className="charts">
            <Card title="Mood (1 to 5)" avg={a.mood} unit="">
              <ResponsiveContainer><LineChart data={series}>{axes({ domain: [1, 5], ticks: [1, 2, 3, 4, 5] })}
                <Line dataKey="mood" name="Mood" stroke={TEAL} strokeWidth={2.5} dot={{ r: 3 }} connectNulls /></LineChart></ResponsiveContainer>
            </Card>
            <Card title="Sleep (hours)" avg={a.sleepHours} unit="h">
              <ResponsiveContainer><BarChart data={series}>{axes({ domain: [0, 12] })}
                <Bar dataKey="sleepHours" name="Sleep (h)" fill="#9b7fc4" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
            </Card>
            <Card title="Water (glasses)" avg={a.waterGlasses} unit="">
              <ResponsiveContainer><BarChart data={series}>{axes({})}
                <Bar dataKey="waterGlasses" name="Glasses" fill="#f0a35e" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
            </Card>
            <Card title="Exercise (minutes)" avg={a.exerciseMinutes} unit=" min">
              <ResponsiveContainer><BarChart data={series}>{axes({})}
                <Bar dataKey="exerciseMinutes" name="Minutes" fill="#7aa95c" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
            </Card>
          </div>

          {data.topSymptoms.length > 0 && (
            <div className="panel">
              <h3>Symptoms you logged most</h3>
              <ul className="symlist">
                {data.topSymptoms.map((s) => (
                  <li key={s.name}><strong>{s.name}</strong> on {s.days} {s.days === 1 ? 'day' : 'days'}, average severity {s.avgSeverity}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
