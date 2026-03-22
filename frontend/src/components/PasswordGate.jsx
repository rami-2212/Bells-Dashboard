import React, { useState, useEffect } from 'react';
import './PasswordGate.css';

const SESSION_KEY = 'smart_road_auth';
const CORRECT_PASSWORD = process.env.REACT_APP_PREVIEW_PASSWORD || 'waterberg2024';

export default function PasswordGate({ children }) {
  const [unlocked, setUnlocked] = useState(false);
  const [input,    setInput]    = useState('');
  const [error,    setError]    = useState(false);
  const [shake,    setShake]    = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === 'true') {
      setUnlocked(true);
    }
  }, []);

  if (unlocked) return children;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input === CORRECT_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setUnlocked(true);
    } else {
      setError(true);
      setShake(true);
      setInput('');
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setError(false), 2500);
    }
  };

  return (
    <div className="password-gate">
      <div className="gate-bg" />
      <div className={`gate-card ${shake ? 'shake' : ''}`}>
        <div className="gate-logo">⚡</div>
        <h1 className="gate-title">Smart Road GIS</h1>
        <p className="gate-subtitle">Waterberg District · South Africa</p>
        <p className="gate-desc">
          Infrastructure management dashboard for ~2,500 km of smart roads,
          90,000 solar street lights and 3,300 AI-enabled CCTV cameras.
        </p>
        <form onSubmit={handleSubmit} className="gate-form">
          <div className={`gate-input-wrap ${error ? 'input-error' : ''}`}>
            <span className="gate-lock">🔒</span>
            <input
              type="password"
              className="gate-input"
              placeholder="Enter access password"
              value={input}
              onChange={e => setInput(e.target.value)}
              autoFocus
            />
          </div>
          {error && <p className="gate-error">Incorrect password. Try again.</p>}
          <button type="submit" className="gate-btn">
            Access Dashboard →
          </button>
        </form>
      </div>
    </div>
  );
}
