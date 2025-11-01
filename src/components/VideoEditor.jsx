import React, {useRef, useState, useEffect} from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';

export default function VideoEditor(){
  const videoRef = useRef();
  const [clips, setClips] = useState([]); // {file, name, start, end, url}
  const [message, setMessage] = useState('');
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const ffmpegRef = useRef();

  async function loadFFmpeg(){
    if(ffmpegRef.current) return;
    setMessage('Loading FFmpeg core (wasm) — this can take a few seconds...');
    const ffmpeg = new FFmpeg();
    ffmpeg.on('log', ({ message }) => console.log(message));
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegRef.current = ffmpeg;
    setFfmpegLoaded(true);
    setMessage('FFmpeg loaded');
  }


  function handleFiles(e){
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('video/'));
    const newClips = files.map(f => {
      return {
        file: f,
        name: f.name,
        start: 0,
        end: null,
        url: URL.createObjectURL(f)
      };
    });
    setClips(prev => prev.concat(newClips));
  }

  function setClipRange(index, start, end){
    setClips(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[index].start = Number(start);
      copy[index].end = end === null ? null : Number(end);
      return copy;
    });
  }

  function removeClip(i){
    setClips(prev => prev.filter((_, idx) => idx !== i));
  }

   async function exportVideo() {
    if (clips.length === 0) return alert('Add at least one clip');
    await loadFFmpeg();

    const ffmpeg = ffmpegRef.current;
    setMessage('Processing clips with fade and crossfade effects...');

    const fadeDuration = 1.0; // seconds
    const segmentFiles = [];

    // Step 1: preprocess each clip (trim + fade in/out)
    for (let i = 0; i < clips.length; i++) {
      const c = clips[i];
      const inputName = `input${i}.mp4`;
      const outName = `clip${i}.mp4`;
      ffmpeg.FS('writeFile', inputName, await c.file.arrayBuffer());

      const start = c.start || 0;
      const duration = c.end != null ? (c.end - start) : null;

      const vf = `fade=t=in:st=0:d=${fadeDuration},fade=t=out:st=${duration ? duration - fadeDuration : 0}:d=${fadeDuration}`;
      const af = `afade=t=in:st=0:d=${fadeDuration},afade=t=out:st=${duration ? duration - fadeDuration : 0}:d=${fadeDuration}`;

      const cmd = [
        '-ss', `${start}`,
        '-i', inputName,
        ...(duration ? ['-t', `${duration}`] : []),
        '-vf', vf,
        '-af', af,
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-c:a', 'aac',
        outName
      ];

      setMessage(`Encoding clip ${i + 1}/${clips.length}...`);
      await ffmpeg.run(...cmd);
      segmentFiles.push(outName);
    }

    // Step 2: apply crossfades between clips
    if (segmentFiles.length === 1) {
      // only one clip
      ffmpeg.FS('rename', segmentFiles[0], 'output.mp4');
    } else {
      // progressively xfade all clips
      let previous = segmentFiles[0];
      for (let i = 1; i < segmentFiles.length; i++) {
        const next = segmentFiles[i];
        const output = `xfaded${i}.mp4`;

        setMessage(`Crossfading clip ${i} with previous...`);
        // use xfade and acrossfade for smooth transitions
        await ffmpeg.run(
          '-i', previous,
          '-i', next,
          '-filter_complex',
          `[0:v][1:v]xfade=transition=fade:duration=${fadeDuration}:offset=${duration ? duration - fadeDuration : 0},format=yuv420p;[0:a][1:a]acrossfade=d=${fadeDuration}`,
          '-c:v', 'libx264', '-preset', 'veryfast',
          '-c:a', 'aac',
          output
        );

        // cleanup old file to save memory
        try { ffmpeg.FS('unlink', previous); } catch {}
        try { ffmpeg.FS('unlink', next); } catch {}

        previous = output;
      }
      ffmpeg.FS('rename', previous, 'output.mp4');
    }

    // Step 3: download
    setMessage('Export complete — preparing download...');
    const data = ffmpeg.FS('readFile', 'output.mp4');
    const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'edited-video.mp4';
    a.click();
    setMessage('Download started.');
  }
  async function exportVideoSimple() {
    if(clips.length === 0) return alert('Add at least one clip');
    await loadFFmpeg();

    const ffmpeg = ffmpegRef.current;
    setMessage('Preparing clips for export...');

    // Write input clips into FFmpeg FS and create trimmed segments
    const segmentFiles = [];
    for(let i=0;i<clips.length;i++){
      const c = clips[i]; // Assuming c.file is a File object
      const inputName = `input${i}.mp4`;
      await ffmpeg.writeFile(inputName, await fetchFile(c.file));
      // Determine duration: if end is null, export full
      const start = c.start || 0;
      const durationOpt = (c.end != null) ? `-t ${(c.end - start).toFixed(3)}` : '';
      // create trimmed output segment
      const outName = `seg${i}.mp4`;
      // use -ss before -i for fast seek
      const cmd = ['-ss', `${start}`, '-i', inputName, '-y']; // -y overwrites output file if it exists
      if(durationOpt) cmd.push('-t', `${(c.end - start).toFixed(3)}`);
      cmd.push('-c', 'copy', outName);
      setMessage(`Creating segment ${i+1}/${clips.length}...`);
      try {
        await ffmpeg.exec(cmd);
      } catch(err){
        // fallback to re-encode if stream copy fails
        await ffmpeg.exec(['-ss', `${start}`, '-i', inputName, '-y', ...(durationOpt ? ['-t', `${(c.end - start).toFixed(3)}`] : []), '-c:v','libx264','-preset','veryfast','-c:a','aac', outName]);
      }
      segmentFiles.push(outName);
    }

    setMessage('Concatenating segments...');
    // Create concat.txt
    const concatList = segmentFiles.map(f => `file '${f}'`).join('\n');
    await ffmpeg.writeFile('concat.txt', concatList);

    // Concatenate
    // Use demuxer
    try {
      await ffmpeg.exec(['-f', 'concat', '-safe', '0', '-i', 'concat.txt', '-c', 'copy', 'output.mp4']);
    } catch(err){
      // fallback re-encode
      await ffmpeg.exec(['-f', 'concat', '-safe','0','-i','concat.txt','-c:v','libx264','-preset','veryfast','-c:a','aac','output.mp4']);
    }

    setMessage('Export finished — downloading...');
    const data = await ffmpeg.readFile('output.mp4');
    const url = URL.createObjectURL(new Blob([data.buffer], {type:'video/mp4'}));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'edited-video.mp4';
    a.click();
    setMessage('Download started.');
  }

  return (
    <div className="video-editor">
      <div className="toolbar-row">
        <label style={{display:'inline-flex',alignItems:'center',gap:8}}>
          <input className="file-input" type="file" accept="video/*" multiple onChange={handleFiles} />
        </label>

        <button onClick={loadFFmpeg} className="secondary" style={{marginLeft:8}} title="Preload FFmpeg">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 12l7 7 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{marginLeft:8}}>Preload FFmpeg</span>
        </button>

        <button onClick={exportVideo} style={{marginLeft:8}} title="Export">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M17 8l-5-5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 3v14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{marginLeft:8}}>Export (ffmpeg.wasm)</span>
        </button>
      </div>

      <div className="editor-body">
        <div className="preview-column">
          <video ref={videoRef} className="editor-preview" controls></video>
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
                    <button onClick={() => { videoRef.current.src = c.url; videoRef.current.currentTime = c.start || 0; videoRef.current.play(); }}>Preview</button>
                    <button onClick={() => removeClip(idx)} style={{marginLeft:6}}>Remove</button>
                  </div>
                </div>

                <div className="clip-controls">
                  <label>Start (s): </label>
                  <input type="number" step="0.1" value={c.start} min="0" onChange={(e)=> setClipRange(idx, e.target.value, c.end)} />
                  <label style={{marginLeft:8}}>End (s/null): </label>
                  <input type="number" step="0.1" value={c.end ?? ''} min="0" onChange={(e)=> setClipRange(idx, c.start, e.target.value === '' ? null : e.target.value)} />
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
