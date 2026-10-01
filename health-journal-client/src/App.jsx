import { useEffect, useState } from 'react';
import Auth from './Auth.jsx';
import Journal from './Journal.jsx';
import Trends from './Trends.jsx';
import Insights from './Insights.jsx';
import ClickEffect from './ClickEffect.jsx';

export default function App() {
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hj_session')); } catch { return null; }
  });
  const [view, setView] = useState('journal');

  const save = (s) => { localStorage.setItem('hj_session', JSON.stringify(s)); setSession(s); };
  const logout = () => { localStorage.removeItem('hj_session'); setSession(null); };

  // Picks the background photo and colours for the current page
  useEffect(() => {
    document.body.dataset.page = !session ? 'login' : view === 'journal' ? 'journal' : 'review';
  }, [session, view]);

  if (!session) return (<><Auth onAuth={save} /><ClickEffect /></>);

  return (
    <div className="shell">
      <ClickEffect />
      <header>
        <h1>Health Journal</h1>
        <nav className="tabs" aria-label="Sections">
          <button className={view === 'journal' ? 'on' : ''} aria-current={view === 'journal'} onClick={() => setView('journal')}>Journal</button>
          <button className={view === 'trends' ? 'on' : ''} aria-current={view === 'trends'} onClick={() => setView('trends')}>Trends</button>
          <button className={view === 'insights' ? 'on' : ''} aria-current={view === 'insights'} onClick={() => setView('insights')}>Insights</button>
        </nav>
        <div><span className="muted">{session.user.name}</span> <button className="link" onClick={logout}>Log out</button></div>
      </header>

      {view === 'journal' && <Journal session={session} onLogout={logout} />}
      {view === 'trends' && <Trends token={session.token} onUnauthorized={logout} />}
      {view === 'insights' && <Insights token={session.token} onUnauthorized={logout} />}

      <footer className="muted">Hey be better with me each day</footer>
    </div>
  );
}
