import React, { useRef, useState, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';


export default function VideoEditor() {
  const videoRef = useRef();
  const [clips, setClips] = useState([]); // {file, name, start, end, url}
  const [message, setMessage] = useState('');
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const ffmpegRef = useRef();
  const fetchFileRef = useRef();
  const wavesurferRef = useRef(null);

  useEffect(() => {
    if (!wavesurferRef.current) {
      wavesurferRef.current = WaveSurfer.create({
        container: '#waveform',
        waveColor: '#ddd',
        progressColor: '#2196f3',
        height: 100,
        responsive: true,
      });
    }

    return () => {
      wavesurferRef.current?.destroy();
    };
  }, []);

    async function loadFFmpeg() {

      if (ffmpegRef.current) return; // If worker already exists, do nothing

      setMessage('Loading FFmpeg core (wasm) — this can take a few seconds...');

  

      const worker = new Worker(new URL('../ffmpegWorker.js', import.meta.url), { type: 'module' });

      ffmpegRef.current = worker; // Store the worker instance

  

      worker.onmessage = (e) => {

        const { type, message, ratio } = e.data;

        switch (type) {

          case 'READY':

            setFfmpegLoaded(true);

            setMessage('FFmpeg loaded');

            break;

          case 'PROGRESS':

            setMessage(`Progress: \${(ratio * 100).toFixed(0)}%`);

            break;

          case 'ERROR':

            console.error('FFmpeg Worker Error:', message);

            setMessage(`FFmpeg Error: \${message}`);

            break;

          case 'DONE':

            // This case will be handled by export functions

            break;

          default:

            break;

        }

      };

  

      worker.onerror = (e) => {

        console.error('FFmpeg Worker Error:', e);

        setMessage(`FFmpeg Worker Error: \${e.message}`);

      };

  

      worker.postMessage({ type: 'INIT' }); // Initialize the worker

    }

  function handleFiles(e) {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('video/'));
    const newClips = files.map(f => ({
      file: f,
      name: f.name,
      start: 0,
      end: null,
      url: URL.createObjectURL(f),
    }));
    setClips(prev => prev.concat(newClips));
  }

  function setClipRange(index, start, end) {
    setClips(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[index].start = Number(start);
      copy[index].end = end === null ? null : Number(end);
      return copy;
    });
  }

  function removeClip(i) {
    setClips(prev => prev.filter((_, idx) => idx !== i));
  }

  async function exportVideo() {
    if (clips.length === 0) return alert('Add at least one clip');
    setMessage('Starting export...');
    try {
      await loadFFmpeg();
      const ffmpeg = ffmpegRef.current;
      if (!ffmpeg) {
        setMessage('FFmpeg not loaded. Please try again.');
        return;
      }
      const fetchFile = fetchFileRef.current;
      setMessage('Preparing segments for concatenation...');

      const segmentFiles = [];
      for (let i = 0; i < clips.length; i++) {
        const c = clips[i];
        const inputName = `input\${i}.mp4`;
        const outName = `seg\${i}.mp4`;
        setMessage(`Processing clip \${i + 1}/\${clips.length}: Writing file...`);
        ffmpeg.FS('writeFile', inputName, await fetchFile(c.file));
        const start = c.start || 0;
        const duration = c.end != null ? c.end - start : null;
        const cmd = [
          '-ss', `\${start}`,
          '-i', inputName,
          ...(duration ? ['-t', `\${duration}`] : []),
          '-c:v', 'libx264',
          '-preset', 'veryfast',
          '-c:a', 'aac',
          outName,
        ];
        setMessage(`Creating segment \${i + 1}/\${clips.length}...`);
        await ffmpeg.run(...cmd);
        segmentFiles.push(outName);
      }

      const concatText = segmentFiles.map(f => `file '\${f}'`).join('\\n');
      ffmpeg.FS('writeFile', 'concat.txt', concatText);
      setMessage('Concatenating segments...');
      try {
        await ffmpeg.run('-f', 'concat', '-safe', '0', '-i', 'concat.txt', '-c', 'copy', 'output.mp4');
      } catch (e) {
        setMessage('Codec copy failed, re-encoding... This may take a while.');
        await ffmpeg.run('-f', 'concat', '-safe', '0', '-i', 'concat.txt', '-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'aac', 'output.mp4');
      }

      setMessage('Export complete — preparing download...');
      const data = ffmpeg.FS('readFile', 'output.mp4');
      const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'edited-video.mp4';
      a.click();
      setMessage('Download started.');
    } catch (error) {
      console.error(error);
      setMessage(`An error occurred during export: \${error.message}. Check the console for more details.`);
    }
  }

  async function exportAudio() {
    if (clips.length === 0) return alert('Add at least one clip');
    setMessage('Starting audio export...');
    try {
      await loadFFmpeg();
      const ffmpeg = ffmpegRef.current;
      if (!ffmpeg) {
        setMessage('FFmpeg not loaded. Please try again.');
        return;
      }
      const fetchFile = fetchFileRef.current;
      setMessage('Preparing for audio export...');

      const audioSegments = [];
      for (let i = 0; i < clips.length; i++) {
        const c = clips[i];
        const inputName = `input\${i}.mp4`;
        const outName = `seg\${i}.mp3`;
        setMessage(`Processing clip \${i + 1}/\${clips.length}: Writing file...`);
        ffmpeg.FS('writeFile', inputName, await fetchFile(c.file));
        const start = c.start || 0;
        const duration = c.end != null ? c.end - start : null;
        const cmd = [
          '-ss', `\${start}`,
          '-i', inputName,
          ...(duration ? ['-t', `\${duration}`] : []),
          '-vn', // no video
          '-c:a', 'libmp3lame',
          outName,
        ];
        setMessage(`Extracting audio from segment \${i + 1}/\${clips.length}...`);
        await ffmpeg.run(...cmd);
        audioSegments.push(outName);
      }

      const concatText = audioSegments.map(f => `file '\${f}'`).join('\\n');
      ffmpeg.FS('writeFile', 'concat.txt', concatText);
      setMessage('Concatenating audio segments...');
      
      await ffmpeg.run('-f', 'concat', '-safe', '0', '-i', 'concat.txt', '-c', 'copy', 'output.mp3');

      setMessage('Export complete — preparing download...');
      const data = ffmpeg.FS('readFile', 'output.mp3');
      const url = URL.createObjectURL(new Blob([data.buffer], { type: 'audio/mp3' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'edited-audio.mp3';
      a.click();
      setMessage('Download started.');
    } catch (error) {
      console.error(error);
      setMessage(`An error occurred during audio export: \${error.message}. Check the console for more details.`);
    }
  }

  return (
    <div className="video-editor">
      <div className="toolbar-row">
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <input className="file-input" type="file" accept="video/*" multiple onChange={handleFiles} />
        </label>

        <button onClick={loadFFmpeg} className="secondary" style={{ marginLeft: 8 }} title="Preload FFmpeg">
          <span style={{ marginLeft: 8 }}>Preload FFmpeg</span>
        </button>

        <button onClick={exportVideo} style={{ marginLeft: 8 }} title="Export MP4">
          <span style={{ marginLeft: 8 }}>Export MP4</span>
        </button>
        <button onClick={exportAudio} style={{ marginLeft: 8 }} title="Export MP3">
          <span style={{ marginLeft: 8 }}>Export MP3</span>
        </button>
      </div>

      <div className="editor-body">
        <div className="preview-column">
          <video ref={videoRef} className="editor-preview" controls></video>
          <div id="waveform" style={{ width: '100%', height: '100px' }}></div>

          <div style={{ marginTop: '8px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button onClick={() => wavesurferRef.current?.play()}>Play Audio</button>
            <button onClick={() => wavesurferRef.current?.pause()} style={{ marginLeft: 8 }}>Pause Audio</button>
            <label style={{ fontSize: '0.9rem' }}>Zoom:</label>
            <input
              type="range"
              min="0"
              max="200"
              defaultValue="0"
              onChange={(e) => wavesurferRef.current?.zoom(Number(e.target.value))}
            />
          </div>

          <p className="hint">Click a clip below to load into preview.</p>
        </div>

        <aside className="clips-sidebar">
          <h3>Clips</h3>
          {clips.length === 0 && <p className="muted">No clips — upload videos above.</p>}
          <div>
            {clips.map((c, idx) => (
              <div key={idx} className="clip-item">
                <div className="clip-row">
                  <div className="clip-name">{c.name}</div>
                  <div>
                    <button
                      onClick={() => {
                        videoRef.current.src = c.url;
                        videoRef.current.currentTime = c.start || 0;
                        videoRef.current.play();
                        if (wavesurferRef.current) {
                          wavesurferRef.current.empty();
                          wavesurferRef.current.load(c.url);
                        }
                      }}
                    >
                      Preview
                    </button>
                    <button onClick={() => removeClip(idx)} style={{ marginLeft: 6 }}>Remove</button>
                  </div>
                </div>

                <div className="clip-controls">
                  <label>Start:</label>
                  <input
                    type="range"
                    min="0"
                    max={c.end ?? 30}
                    step="0.1"
                    value={c.start}
                    onChange={(e) => setClipRange(idx, e.target.value, c.end)}
                  />
                  <label style={{ marginLeft: 8 }}>End:</label>
                  <input
                    type="range"
                    min={c.start}
                    max={30}
                    step="0.1"
                    value={c.end ?? 30}
                    onChange={(e) =>
                      setClipRange(idx, c.start, e.target.value === '' ? null : e.target.value)
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <div className="status-row">
        <strong>Status:</strong> {message} {ffmpegLoaded ? '(ffmpeg loaded)' : ''}
      </div>

      <div className="note muted">
        <small>Notes: ffmpeg.wasm runs entirely in the browser. Large files can be slow and memory-heavy. For production, prefer server-side export.</small>
      </div>
    </div>
  );
}