// useWaveSurfer.js
import { useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';

export function useWaveSurfer(containerId, audioUrl) {
  const wavesurferRef = useRef(null);

  useEffect(() => {
    if (!wavesurferRef.current) {
      wavesurferRef.current = WaveSurfer.create({
        container: containerId,
        waveColor: '#ddd',
        progressColor: '#2196f3',
        height: 100,
        responsive: true,
      });
    }

    if (audioUrl) {
      wavesurferRef.current.load(audioUrl);
    }

    return () => {
      wavesurferRef.current?.destroy();
    };
  }, [containerId, audioUrl]);

  return wavesurferRef;
}