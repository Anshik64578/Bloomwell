import { useEffect, useState } from 'react';
import { api } from './api.js';

const today = () => new Date().toLocaleDateString('en-CA');

export default function Insights({ token, onUnauthorized }) {
  const [range, setRange] = useState('7d');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    api(`/insights?range=${range}&to=${today()}`, { token }).then(setData).catch((e) => {
      if (e.status === 401) onUnauthorized(); else setError(e.message);
    });
  }, [range]);

  if (error) return <p className="error" role="alert">{error}</p>;
  if (!data) return <p className="muted">Looking for patterns</p>;

  return (
    <section>
      <div className="top">
        <h2>Patterns in your logs</h2>
        <div className="tabs" role="group" aria-label="Time range">
          <button className={range === '7d' ? 'on' : ''} onClick={() => setRange('7d')}>Last 7 days</button>
          <button className={range === '30d' ? 'on' : ''} onClick={() => setRange('30d')}>Last 30 days</button>
        </div>
      </div>

      {!data.enough ? (
        <p className="muted">Log at least 3 days in this period and your patterns will show up here. You have {data.entriesLogged} so far.</p>
      ) : (
        <ul className="insights">
          {data.insights.map((i, n) => <li key={n} className="panel">{i.text}</li>)}
        </ul>
      )}
      <p className="muted">Don't worry I will take care of you.</p>
    </section>
  );
}
