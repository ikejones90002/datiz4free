import React from 'react';
import VideoEditor from './components/VideoEditor';

export default function App(){
  return (
    <div style={{padding:20, fontFamily:'sans-serif'}}>
      <h1>Browser Video Editor — Starter</h1>
      <VideoEditor />
    </div>
  );
}
