import React, { useState, useEffect } from 'react';
import VideoEditor from './components/VideoEditor.jsx';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000); // 2 seconds
    return () => clearTimeout(timer);
  }, []);

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
        <VideoEditor />
      )}
    </>
  );
}
