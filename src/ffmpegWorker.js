// src/workers/ffmpegWorker.js
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

let ffmpeg = null;

self.onmessage = async (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'INIT':
      if (!ffmpeg) {
        ffmpeg = createFFmpeg({
          log: true,
          progress: ({ ratio }) => {
            self.postMessage({ type: 'PROGRESS', ratio });
          },
        });
        await ffmpeg.load();
        self.postMessage({ type: 'READY' });
      }
      break;

    case 'PROCESS':
      if (!ffmpeg) return self.postMessage({ type: 'ERROR', message: 'FFmpeg not loaded' });

      try {
        const { files, commands } = payload;

        // Write input files to virtual FS
        for (const file of files) {
          ffmpeg.FS('writeFile', file.name, await fetchFile(file.data));
        }

        // Run the command sequence
        await ffmpeg.run(...commands);

        // Read output file
        const outputData = ffmpeg.FS('readFile', 'output.mp4');
        const blob = new Blob([outputData.buffer], { type: 'video/mp4' });

        self.postMessage({ type: 'DONE', blob });
      } catch (err) {
        self.postMessage({ type: 'ERROR', message: err.message });
      }
      break;

    case 'ABORT':
      try {
        ffmpeg.exit();
        ffmpeg = null;
        self.postMessage({ type: 'ABORTED' });
      } catch (err) {
        self.postMessage({ type: 'ERROR', message: err.message });
      }
      break;

    default:
      self.postMessage({ type: 'ERROR', message: 'Unknown message type' });
  }
};
export {};
// src/workers/ffmpegWorker.js