import React, { useState, useEffect } from 'react';
import VideoEditor from './components/VideoEditor.jsx';
import lightLogo from './assets/logo.svg';
import darkLogo from './assets/logo-dark.svg';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isDark, setIsDark] = useState(typeof document !== 'undefined' && document.body.classList.contains('dark'));

  useEffect(() => {
    console.log('[App] mounted');
    // theme and accent init
    const savedTheme = localStorage.getItem('datiz-theme');
    if (savedTheme === 'dark') document.body.classList.add('dark');
    const savedAccent = localStorage.getItem('datiz-accent');
    if (savedAccent) {
      try {
        const { a, b } = JSON.parse(savedAccent);
        document.documentElement.style.setProperty('--accent', a);
        document.documentElement.style.setProperty('--accent-2', b);
        document.documentElement.style.setProperty('--accent-strong', `linear-gradient(90deg, ${a}, ${b})`);
      } catch (e){}
    }

    const timer = setTimeout(() => setShowSplash(false), 2000); // 2 seconds
    return () => clearTimeout(timer);
  }, []);

  function toggleTheme(){
    const next = document.body.classList.toggle('dark');
    setIsDark(next);
    localStorage.setItem('datiz-theme', next ? 'dark' : 'light');
  }

  function setAccent(a, b){
    document.documentElement.style.setProperty('--accent', a);
    document.documentElement.style.setProperty('--accent-2', b);
    document.documentElement.style.setProperty('--accent-strong', `linear-gradient(90deg, ${a}, ${b})`);
    localStorage.setItem('datiz-accent', JSON.stringify({a,b}));
  }

  return (
    <>
      {showSplash ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
          color: 'white',
          fontFamily: 'Poppins, sans-serif',
          fontSize: '2rem',
          fontWeight: 'bold',
          letterSpacing: '2px',
          flexDirection: 'column',
          animation: 'fadeOut 0.5s ease 1.5s forwards'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 10 }}>🎬</div>
          <div>DatIz4Free</div>
          <div style={{
  width: 30,
  height: 30,
  border: '3px solid rgba(255,255,255,0.4)',
  borderTop: '3px solid white',
  borderRadius: '50%',
  marginTop: 20,
  animation: 'spin 1s linear infinite'
}}></div>

<style>
  {`
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `}
</style>

          <style>
            {`
              @keyframes fadeOut {
                to {
                  opacity: 0;
                  visibility: hidden;
                }
              }
            `}
          </style>
        </div>
      ) : (
        <div className="app-container">
          <header className="header">
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <img src={isDark ? darkLogo : lightLogo} alt="DatIz4Free" style={{height:44, width:'auto', borderRadius:6}} />
              <div style={{display:'flex',flexDirection:'column'}}>
                <div style={{fontWeight:700, lineHeight:1}}>DatIz4Free</div>
                <small style={{opacity:0.85}}>🎬 browser editor</small>
              </div>
            </div>
            <div className="header-controls">
              <div className="accent-picks">
                <button title="Teal / Blue" onClick={() => setAccent('#0ea5a4','#3b82f6')} style={{background:'linear-gradient(90deg,#0ea5a4,#3b82f6)'}}></button>
                <button title="Purple" onClick={() => setAccent('#8b5cf6','#ec4899')} style={{background:'linear-gradient(90deg,#8b5cf6,#ec4899)'}}></button>
                <button title="Orange" onClick={() => setAccent('#fb923c','#f97316')} style={{background:'linear-gradient(90deg,#fb923c,#f97316)'}}></button>
              </div>
              <button className="secondary" onClick={toggleTheme} style={{marginLeft:12}} title="Toggle theme">
                {isDark ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 19v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M4.2 4.2l1.4 1.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.4 18.4l1.4 1.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 12h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M4.2 19.8l1.4-1.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.4 5.6l1.4-1.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                )}
              </button>
            </div>
          </header>
          <div className="content">
            <VideoEditor />
          </div>
        </div>
      )}
    </>
  );
}
