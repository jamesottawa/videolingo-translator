import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import * as googleTTS from "google-tts-api";
import { v4 as uuidv4 } from "uuid";
import translate from "google-translate-api-x";

// Set ffmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic as string);
}

const upload = multer({ dest: "/tmp/vp_uploads/" });

function formatTime(seconds: number): string {
    const d = new Date(seconds * 1000);
    return [
      String(d.getUTCHours()).padStart(2, '0'),
      String(d.getUTCMinutes()).padStart(2, '0'),
      String(d.getUTCSeconds()).padStart(2, '0')
    ].join(':') + '.' + String(d.getUTCMilliseconds()).padStart(3, '0');
}

function parseVttCues(vtt: string) {
    const cues = [];
    const regex = /(?:(\d{2}):)?(\d{2}):(\d{2})\.(\d{3})\s-->\s(?:(?:(\d{2}):)?(\d{2}):(\d{2})\.(\d{3}))[\r\n]+([\s\S]*?)(?=\n\n|\n*$)/g;
    let match;
    while ((match = regex.exec(vtt)) !== null) {
        const h = match[1] ? parseInt(match[1], 10) : 0;
        const m = parseInt(match[2], 10);
        const s = parseInt(match[3], 10);
        const ms = parseInt(match[4], 10);
        
        const startTimeMs = (h * 3600 + m * 60 + s) * 1000 + ms;
        let text = match[9].trim().replace(/\n/g, ' ');
        // Clean metadata like tags if they exist
        text = text.replace(/<[^>]+>/g, '');
        if (text) {
             cues.push({ startTimeMs, text });
        }
    }
    return cues;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/translate", upload.single("video"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No video file uploaded" });
    }

    const { targetLanguage } = req.body;
    if (!targetLanguage) {
      return res.status(400).json({ error: "Target language is required" });
    }

    try {
      console.log(`Uploading ${req.file.originalname} to Deepgram for transcription...`);
      
      const apiKey = process.env.DEEPGRAM_API_KEY || "941a9c7af104c7ccaa07c4753a40cc578bf2af07";
      if (!apiKey) {
         throw new Error("DEEPGRAM_API_KEY is not configured on the server.");
      }

      // First run speech-to-text with Deepgram
      const audioData = fs.readFileSync(req.file.path);
      const resData = await fetch("https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&utterances=true", {
          method: "POST",
          headers: {
              "Authorization": `Token ${apiKey}`,
              "Content-Type": req.file.mimetype || "audio/mp4"
          },
          body: audioData
      });

      if (!resData.ok) {
          const e = await resData.text();
          throw new Error("Deepgram Error: " + e);
      }

      const dgResult = await resData.json();
      const utterances = dgResult.results?.utterances || [];

      if (utterances.length === 0) {
          return res.json({ vttText: "WEBVTT\n\n", videoId: req.file.filename });
      }

      console.log(`Transcribed ${utterances.length} utterances. Translating to ${targetLanguage}...`);

      // Extract all texts
      const texts = utterances.map((u: any) => u.transcript);
      
      // We can chunk them if there are too many, but translate supports arrays
      let translationsArray: string[] = [];
      try {
          const transResult: any = await translate(texts, { to: targetLanguage });
          translationsArray = Array.isArray(transResult) ? transResult.map(r => r.text) : [transResult.text];
      } catch (err: any) {
          console.error("Free Translation Error:", err);
          throw new Error("Failed to translate the transcribed text");
      }

      // Construct VTT
      let vttContent = "WEBVTT\n\n";
      for (let i = 0; i < utterances.length; i++) {
          const u = utterances[i];
          const tText = translationsArray[i] || u.transcript;
          vttContent += `${formatTime(u.start)} --> ${formatTime(u.end)}\n${tText}\n\n`;
      }

      const videoId = req.file.filename;

      // Keep original file for dubbing for 1 hour
      setTimeout(() => {
          fs.unlink(path.join("/tmp/vp_uploads/", videoId), () => {});
      }, 60 * 60 * 1000);

      res.json({ vttText: vttContent, videoId });
    } catch (error) {
      console.error("Translation error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/dub", async (req, res) => {
      const { videoId, vttText, targetLang, voiceProvider, voiceVal } = req.body;
      if (!videoId || !vttText || !targetLang) {
          return res.status(400).json({ error: "Missing data (videoId, vttText, targetLang required)" });
      }
      
      const videoPath = path.join("/tmp/vp_uploads/", videoId);
      if (!fs.existsSync(videoPath)) {
          return res.status(404).json({ error: "Original video expired or not found. Please upload again." });
      }
  
      const apiKey = process.env.DEEPGRAM_API_KEY || "941a9c7af104c7ccaa07c4753a40cc578bf2af07";

      try {
          const cues = parseVttCues(vttText);
          if (cues.length === 0) {
              return res.status(400).json({ error: "No cues found in VTT" });
          }
  
          const sessionDir = path.join("/tmp/vp_uploads/", uuidv4());
          fs.mkdirSync(sessionDir, { recursive: true });
  
          const command = ffmpeg(videoPath);
          
          let filterComplex = `[0:a]volume=0.1[base];`;
          let amixInputs = `[base]`;
  
          let inputIndex = 1;
          for (let i = 0; i < Math.min(cues.length, 100); i++) {
              const cue = cues[i];
              const textToSpeak = cue.text.length > 200 && voiceProvider !== 'deepgram' ? cue.text.substring(0, 199) : cue.text;
              
              try {
                  const mp3Path = path.join(sessionDir, `cue_${i}.mp3`);
                  
                  if (voiceProvider === 'deepgram') {
                      const ttsModel = voiceVal || "aura-asteria-en";
                      const response = await fetch(`https://api.deepgram.com/v1/speak?model=${ttsModel}`, {
                          method: 'POST',
                          headers: {
                              'Authorization': `Token ${apiKey}`,
                              'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({ text: textToSpeak })
                      });
                      
                      if (!response.ok) {
                          throw new Error(`Deepgram TTS failed: ${await response.text()}`);
                      }
                      const buffer = await response.arrayBuffer();
                      fs.writeFileSync(mp3Path, Buffer.from(buffer));
                  } else {
                      const ttsLang = voiceVal || targetLang;
                      const b64 = await googleTTS.getAudioBase64(textToSpeak, { lang: ttsLang, slow: false, host: 'https://translate.google.com' });
                      if (!b64) continue;
                      fs.writeFileSync(mp3Path, Buffer.from(b64, 'base64'));
                  }
                  
                  command.input(mp3Path);
                  filterComplex += `[${inputIndex}:a]adelay=${cue.startTimeMs}|${cue.startTimeMs}[a${inputIndex}];`;
                  amixInputs += `[a${inputIndex}]`;
                  
                  inputIndex++;
              } catch (ttsErr) {
                  console.error("TTS generation failed for cue:", i, ttsErr);
                  continue; // skip failed audio
              }
          }
          
          filterComplex += `${amixInputs}amix=inputs=${inputIndex}:duration=first:dropout_transition=0:normalize=0[outa]`;
  
          const outputPath = path.join(sessionDir, `output.mp4`);
          
          command
              .complexFilter(filterComplex, ['outa'])
              .outputOptions([
                  '-map 0:v',
                  '-map [outa]',
                  '-c:v copy',
                  '-c:a aac',
                  '-y'
              ])
              .on('end', () => {
                  res.download(outputPath, 'dubbed_video.mp4', () => {
                      fs.rm(sessionDir, { recursive: true, force: true }, () => {});
                  });
              })
              .on('error', (err) => {
                  console.error('FFmpeg Error:', err);
                  fs.rm(sessionDir, { recursive: true, force: true }, () => {});
                  res.status(500).json({ error: "Failed to generate video", details: err.message });
              })
              .save(outputPath);
              
      } catch (e: any) {
           console.error("Dubbing route error:", e);
           res.status(500).json({ error: "Failed Server processing", details: e.message });
      }
  });

  app.post("/api/preview_voice", async (req, res) => {
      const { provider, val, text } = req.body;
      const apiKey = process.env.DEEPGRAM_API_KEY || "941a9c7af104c7ccaa07c4753a40cc578bf2af07";
      
      try {
          if (provider === 'deepgram') {
              const response = await fetch(`https://api.deepgram.com/v1/speak?model=${val}`, {
                  method: 'POST',
                  headers: {
                      'Authorization': `Token ${apiKey}`,
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({text})
              });
              
              if (!response.ok) throw new Error(await response.text());
              const buffer = await response.arrayBuffer();
              res.set('Content-Type', 'audio/mp3');
              res.send(Buffer.from(buffer));
          } else {
              const b64 = await googleTTS.getAudioBase64(text, { lang: val, slow: false, host: 'https://translate.google.com' });
              res.set('Content-Type', 'audio/mp3');
              res.send(Buffer.from(b64, 'base64'));
          }
      } catch (e: any) {
          console.error("Preview error:", e);
          res.status(500).json({ error: e.message });
      }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
