// src/components/Timeline.jsx
import React from 'react';

export default function Timeline({ clips, onRemove, onSelect, selectedIndex }) {
  return (
    <div
      style={{
        background: '#f5f5f5',
        padding: '10px',
        borderRadius: 6,
        marginTop: 20,
        overflowX: 'auto',
        whiteSpace: 'nowrap'
      }}
    >
      {clips.length === 0 ? (
        <div style={{ color: '#777', fontSize: 14 }}>No clips added yet</div>
      ) : (
        clips.map((clip, index) => (
          <div
            key={index}
            onClick={() => onSelect(index)}
            style={{
              display: 'inline-block',
              padding: '8px 10px',
              marginRight: 8,
              background: selectedIndex === index ? '#1976d2' : '#ccc',
              color: selectedIndex === index ? 'white' : 'black',
              borderRadius: 4,
              cursor: 'pointer',
              minWidth: 80,
              textAlign: 'center',
              position: 'relative'
            }}
          >
            Clip {index + 1}
            <div style={{ fontSize: 10 }}>
              {clip.start ?? 0}s → {clip.end ?? 'end'}s
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(index);
              }}
              style={{
                position: 'absolute',
                top: 2,
                right: 4,
                background: 'transparent',
                border: 'none',
                color: selectedIndex === index ? 'white' : '#444',
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              ✖
            </button>
          </div>
        ))
      )}
    </div>
  );
}
