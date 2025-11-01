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
              <div style={{display:'flex',flexDirection:'column'}}>
                <img src={isDark ? darkLogo : lightLogo} alt="DatIz4Free" style={{height:44, width:'auto', borderRadius:6}} />
                <small style={{opacity:0.85}}>🎬 browser editor</small>
              </div>
            </div>
            <div className="header-controls">
              <div className="accent-picks">
                <button title="Teal / Blue" onClick={() => setAccent('#0ea5a4','#3b82f6')} style={{background:'linear-gradient(90deg,#0ea5a4,#3b82f6)'}}></button>
                <button title="Purple" onClick={() => setAccent('#8b5cf6','#ec4899')} style={{background:'linear-gradient(90deg,#8b5cf6,#ec4899)'}}></button>
                <button title="Orange" onClick={() => setAccent('#fb923c','#f97316')} style={{background:'linear-gradient(90deg,#fb923c,#f97316)'}}></button>
              </div>
              <button className="secondary" onClick={toggleTheme} style={{marginLeft:12, color: '#333', border: '1px solid #333'}} title="Toggle theme">
                Light/Dark Toggle
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
