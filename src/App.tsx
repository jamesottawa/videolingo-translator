import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Play, Pause, Settings2, Globe, Volume2, VolumeX, Loader2, Download, Rewind, FastForward, ChevronLeft, ChevronRight, ChevronDown, Check, Volume1 } from 'lucide-react';
import { cn } from './lib/utils';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'hi', name: 'Hindi' },
];

interface VoiceOption {
  id: string;
  name: string;
  provider: string;
  val: string;
  gender?: string;
  accent?: string;
  description?: string;
  previewText?: string;
}

const VOICES: { [key: string]: VoiceOption[] } = {
  'en': [
    { id: 'en-aura-asteria', name: 'Asteria', provider: 'deepgram', val: 'aura-asteria-en', gender: 'Female', accent: 'US', description: 'Clear and professional', previewText: 'Hello, my name is Asteria.' },
    { id: 'en-aura-orion', name: 'Orion', provider: 'deepgram', val: 'aura-orion-en', gender: 'Male', accent: 'US', description: 'Deep and articulate', previewText: 'Hello, my name is Orion.' },
    { id: 'en-aura-athena', name: 'Athena', provider: 'deepgram', val: 'aura-athena-en', gender: 'Female', accent: 'UK', description: 'Soft and polite', previewText: 'Hello, my name is Athena.' },
    { id: 'en-aura-luna', name: 'Luna', provider: 'deepgram', val: 'aura-luna-en', gender: 'Female', accent: 'US', description: 'Warm and natural', previewText: 'Hello, my name is Luna.' },
    { id: 'en-US', name: 'Standard US', provider: 'google', val: 'en', gender: 'Unspecified', accent: 'US', description: 'Default browser voice', previewText: 'Hello, this is a standard voice.' },
    { id: 'en-GB', name: 'Standard UK', provider: 'google', val: 'en-GB', gender: 'Unspecified', accent: 'UK', description: 'Default browser voice', previewText: 'Hello, this is a standard voice.' },
  ],
  'es': [
    { id: 'es-aura-sirio', name: 'Sirio', provider: 'deepgram', val: 'aura-2-sirio-es', gender: 'Male', accent: 'Spain', description: 'Clear and natural', previewText: 'Hola, mi nombre es Sirio.' },
    { id: 'es-aura-celeste', name: 'Celeste', provider: 'deepgram', val: 'aura-2-celeste-es', gender: 'Female', accent: 'Spain', description: 'Professional and warm', previewText: 'Hola, mi nombre es Celeste.' },
    { id: 'es-ES', name: 'Standard Spain', provider: 'google', val: 'es', gender: 'Unspecified', accent: 'Spain', description: 'Default browser voice', previewText: 'Hola, esta es una voz estándar.' },
    { id: 'es-US', name: 'Standard Latin America', provider: 'google', val: 'es-US', gender: 'Unspecified', accent: 'LatAm', description: 'Default browser voice', previewText: 'Hola, esta es una voz estándar.' },
  ],
  'fr': [
    { id: 'fr-FR', name: 'Standard France', provider: 'google', val: 'fr', gender: 'Unspecified', accent: 'France', description: 'Default browser voice', previewText: 'Bonjour, ceci est une voix standard.' },
    { id: 'fr-CA', name: 'Standard Canada', provider: 'google', val: 'fr-CA', gender: 'Unspecified', accent: 'Canada', description: 'Default browser voice', previewText: 'Bonjour, ceci est une voix standard.' },
  ],
  'de': [
    { id: 'de-DE', name: 'Standard German', provider: 'google', val: 'de', gender: 'Unspecified', accent: 'Germany', description: 'Default browser voice', previewText: 'Hallo, das ist eine Standardstimme.' }
  ],
  'it': [
    { id: 'it-IT', name: 'Standard Italian', provider: 'google', val: 'it', gender: 'Unspecified', accent: 'Italy', description: 'Default browser voice', previewText: 'Ciao, questa è una voce standard.' }
  ],
  'ja': [
    { id: 'ja-JP', name: 'Standard Japanese', provider: 'google', val: 'ja', gender: 'Unspecified', accent: 'Japan', description: 'Default browser voice', previewText: 'こんにちは、これは標準的な音声です。' }
  ],
  'ko': [
    { id: 'ko-KR', name: 'Standard Korean', provider: 'google', val: 'ko', gender: 'Unspecified', accent: 'Korea', description: 'Default browser voice', previewText: '안녕하세요, 기본 음성입니다.' }
  ],
  'zh': [
    { id: 'zh-CN', name: 'Standard Mandarin', provider: 'google', val: 'zh-CN', gender: 'Unspecified', accent: 'China', description: 'Default browser voice', previewText: '你好，这是一个标准的声音。' }
  ],
  'pt': [
    { id: 'pt-BR', name: 'Standard Brazil', provider: 'google', val: 'pt-BR', gender: 'Unspecified', accent: 'Brazil', description: 'Default browser voice', previewText: 'Olá, esta é uma voz padrão.' },
    { id: 'pt-PT', name: 'Standard Portugal', provider: 'google', val: 'pt-PT', gender: 'Unspecified', accent: 'Portugal', description: 'Default browser voice', previewText: 'Olá, esta é uma voz padrão.' },
  ],
  'hi': [
    { id: 'hi-IN', name: 'Standard Hindi', provider: 'google', val: 'hi', gender: 'Unspecified', accent: 'India', description: 'Default browser voice', previewText: 'नमस्ते, यह एक मानक आवाज़ है।' }
  ]
};

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState('es');
  const [selectedVoiceId, setSelectedVoiceId] = useState('es-aura-sirio');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [vttUrl, setVttUrl] = useState<string | null>(null);
  const [vttContent, setVttContent] = useState<string | null>(null);
  const [dubbingEnabled, setDubbingEnabled] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);
  const [isVoiceSelectOpen, setIsVoiceSelectOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLTrackElement>(null);
  const volumeRef = useRef(volume);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current.src = "";
      }
    };
  }, []);

  const playVoicePreview = async (voice: VoiceOption, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingPreviewId === voice.id && audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      setPlayingPreviewId(null);
      return;
    }

    setPlayingPreviewId(voice.id);
    try {
      const response = await fetch('/api/preview_voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: voice.provider, val: voice.val, text: voice.previewText })
      });
      if (!response.ok) throw new Error('Preview failed');
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      
      const audio = new Audio(audioUrl);
      audioPreviewRef.current = audio;
      audio.onended = () => setPlayingPreviewId(null);
      audio.onerror = () => setPlayingPreviewId(null);
      audio.play();
    } catch (err: any) {
      console.error(err);
      setGlobalError("Preview error: " + (err.message || String(err)));
      setPlayingPreviewId(null);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setupFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setupFile(e.target.files[0]);
    }
  };

  const setupFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('video/')) {
      alert('Please select a valid video file.');
      return;
    }
    setFile(selectedFile);
    setVideoUrl(URL.createObjectURL(selectedFile));
    setVttUrl(null); // reset translation
    setVttContent(null);
    setVideoId(null);
    setCurrentTime(0);
    setPlaybackSpeed(1);
    setIsPlaying(false);
  };

  const startTranslation = async () => {
    if (!file) return;
    setIsProcessing(true);
    setGlobalError(null);

    const formData = new FormData();
    formData.append('video', file);
    formData.append('targetLanguage', LANGUAGES.find(l => l.code === targetLang)?.name || targetLang);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        body: formData,
      });

      let responseText = "";
      try {
         responseText = await response.text();
      } catch(e) {}

      if (!response.ok) {
        let msg = `HTTP Error ${response.status}: Failed to translate`;
        try {
          if (responseText) {
              const body = JSON.parse(responseText);
              msg = body.error || msg;
              if (body.details) msg += " - " + body.details;
          }
        } catch(e) {
          if (responseText.trim().length > 0) {
             msg += " - Server response issue.";
          }
        }
        throw new Error(msg);
      }

      let data;
      try {
          data = JSON.parse(responseText);
      } catch (e: any) {
          throw new Error("Server returned invalid data format instead of JSON.");
      }

      if (data.vttText) {
        const blob = new Blob([data.vttText], { type: 'text/vtt' });
        const url = URL.createObjectURL(blob);
        setVttUrl(url);
        setVttContent(data.vttText);
      }
      if (data.videoId) {
        setVideoId(data.videoId);
      }
    } catch (error: any) {
      setGlobalError(error.message || String(error));
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadDubbedVideo = async () => {
    if (!videoId || !vttContent) return;
    setIsDownloading(true);
    setGlobalError(null);

    try {
      const activeVoice = VOICES[targetLang]?.find(v => v.id === selectedVoiceId) || VOICES[targetLang][0];

      const response = await fetch('/api/dub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           videoId, 
           vttText: vttContent, 
           targetLang,
           voiceProvider: activeVoice.provider,
           voiceVal: activeVoice.val
        })
      });

      if (!response.ok) {
        let msg = `HTTP Error ${response.status}: Failed to dub video`;
        try {
          const text = await response.text();
          try {
             if (text) {
                const body = JSON.parse(text);
                msg = body.error || msg;
                if (body.details) msg += " - " + body.details;
             }
          } catch(e) {
             if (text.trim().length > 0) {
                msg += " - Server response format issue.";
             }
          }
        } catch(e) {}
        throw new Error(msg);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `video_dub_translated.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch(err: any) {
      setGlobalError(err.message || String(err));
    } finally {
      setIsDownloading(false);
    }
  };

  // Video Playback Controls Setup
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => setDuration(video.duration);
    
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    
    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
    };
  }, [videoUrl]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
    }
  };

  const changeSpeed = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
  };

  const skipTime = (amount: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += amount;
    }
  };

  const stepFrame = (forward: boolean) => {
    if (videoRef.current) {
      // Assuming roughly 30fps = 0.0333s per frame
      videoRef.current.currentTime += forward ? 0.0333 : -0.0333;
      if (isPlaying) {
         videoRef.current.pause();
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Number(e.target.value);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = Number(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
    }
  };

  // Set up Speech Synthesis based on Video Cues
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let textTrack: TextTrack | null = null;

    const handleCueChange = (e: Event) => {
      if (!dubbingEnabled) return;
      const track = e.target as TextTrack;
      const activeCues = track.activeCues;
      
      if (activeCues && activeCues.length > 0) {
        const cue = activeCues[0] as VTTCue;
        const text = cue.text;
        
        // Use browser TTS
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = targetLang;
        utterance.volume = volumeRef.current;
        // Adjust rate to try to fit within the cue duration if desired
        // const duration = cue.endTime - cue.startTime;
        
        window.speechSynthesis.cancel(); // Stop what was playing
        window.speechSynthesis.speak(utterance);
      }
    };

    const onLoadTrack = () => {
      if (video.textTracks.length > 0) {
        textTrack = video.textTracks[0];
        textTrack.mode = 'showing';
        textTrack.addEventListener('cuechange', handleCueChange);
      }
    };

    video.addEventListener('loadeddata', onLoadTrack);
    // Might need timeout or waiting for track to append
    setTimeout(onLoadTrack, 500);

    return () => {
      video.removeEventListener('loadeddata', onLoadTrack);
      if (textTrack) {
        textTrack.removeEventListener('cuechange', handleCueChange);
      }
      window.speechSynthesis.cancel();
    };
  }, [vttUrl, dubbingEnabled, targetLang]);

  return (
    <div className="h-screen w-full flex flex-col font-sans text-slate-900 bg-white overflow-hidden selection:bg-indigo-100">
      {/* Top Navigation Bar */}
      <nav className="h-16 border-b border-slate-100 flex items-center justify-between px-8 bg-white shrink-0">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
               <Globe className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold tracking-tight text-xl">VideoLingo</span>
          </div>
          <div className="h-6 w-px bg-slate-200"></div>
          <div className="text-sm text-slate-500 font-medium">
            Project: <span className="text-slate-900">{file ? file.name : "Untitled project"}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
           {videoUrl && (
             <button 
                onClick={() => { setFile(null); setVideoUrl(null); setVttUrl(null); setVideoId(null); window.speechSynthesis.cancel(); }}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200"
              >
                Clear Video
              </button>
           )}
           {vttUrl && videoId && (
               <button 
                  onClick={downloadDubbedVideo}
                  disabled={isDownloading}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
                >
                  {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Export Video
                </button>
           )}
        </div>
      </nav>

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden">
        {/* Video Preview Section */}
        <div className="flex-1 bg-slate-50 p-6 flex flex-col overflow-hidden">
          <div className="flex-1 bg-black rounded-xl relative overflow-hidden shadow-2xl flex items-center justify-center">
            {videoUrl ? (
                  <video
                  ref={videoRef}
                  src={videoUrl}
                  crossOrigin="anonymous"
                  className="w-full h-full object-contain bg-black"
                  muted={dubbingEnabled && !!vttUrl} // Mute original audio if we have dubbing
                  onClick={togglePlay}
                >
                  {vttUrl && (
                    <track
                      ref={trackRef}
                      kind="subtitles"
                      src={vttUrl}
                      srcLang={targetLang}
                      label="Translated"
                      default
                    />
                  )}
                </video>
              ) : (
                <div 
                  className="absolute inset-0 flex flex-col items-center justify-center hover:bg-white/5 transition-colors cursor-pointer group"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-8 h-8 text-white/80" />
                  </div>
                  <p className="text-white/60 font-medium">Drop video here or click to browse</p>
                  <p className="text-white/40 text-xs mt-2">Supports MP4, WebM, MOV</p>
                </div>
              )}
               <input 
                type="file" 
                accept="video/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={(e) => {
                  setGlobalError(null);
                  handleFileSelect(e);
                }}
              />
          </div>

          {/* Advanced Playback Controls */}
          {videoUrl && (
            <div className="h-16 mt-4 flex items-center justify-between gap-6 px-4 shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="flex items-center gap-4">
                  <button onClick={togglePlay} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-900 shadow-sm text-white hover:bg-slate-700 transition-colors">
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 ml-1 fill-current" />}
                  </button>
                  <div className="text-xs font-mono text-slate-500 w-[90px] text-center">
                     {new Date((currentTime || 0) * 1000).toISOString().slice(14, 19)} / {new Date((duration || 0) * 1000).toISOString().slice(14, 19)}
                  </div>
               </div>
               
               <div className="flex-1 flex items-center mx-4">
                 <input 
                    type="range" 
                    min="0" 
                    max={duration || 1} 
                    step="0.001"
                    value={currentTime} 
                    onChange={handleSeek} 
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                 />
               </div>

               <div className="flex items-center gap-2">
                 <button onClick={() => skipTime(-5)} className="p-2 hover:bg-slate-100 rounded-md text-slate-600 transition-colors" title="Rewind 5s">
                   <Rewind className="w-4 h-4" />
                 </button>
                 <div className="w-px h-6 bg-slate-200 mx-1"></div>
                 <button onClick={() => stepFrame(false)} className="p-2 hover:bg-slate-100 rounded-md text-slate-600 transition-colors" title="Previous Frame (-1/30s)">
                   <ChevronLeft className="w-5 h-5" />
                 </button>
                 <button onClick={() => stepFrame(true)} className="p-2 hover:bg-slate-100 rounded-md text-slate-600 transition-colors" title="Next Frame (+1/30s)">
                   <ChevronRight className="w-5 h-5" />
                 </button>
                 <div className="w-px h-6 bg-slate-200 mx-1"></div>
                 <button onClick={() => skipTime(5)} className="p-2 hover:bg-slate-100 rounded-md text-slate-600 transition-colors" title="Forward 5s">
                   <FastForward className="w-4 h-4" />
                 </button>
               </div>
               
               <div className="flex items-center gap-3 ml-2 border pl-3 pr-2 py-1.5 border-slate-200 rounded-lg bg-slate-50">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Speed</span>
                 <select 
                    value={playbackSpeed} 
                    onChange={(e) => changeSpeed(Number(e.target.value))} 
                    className="text-xs font-semibold text-slate-700 bg-transparent border-none appearance-none cursor-pointer focus:outline-none"
                 >
                    <option value={0.5}>0.5x</option>
                    <option value={1}>1.0x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={2}>2.0x</option>
                 </select>
               </div>

               <div className="flex items-center gap-2 ml-2 border px-3 py-1.5 border-slate-200 rounded-lg bg-slate-50">
                 {volume === 0 ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-slate-600" />}
                 <input
                   type="range"
                   min="0"
                   max="1"
                   step="0.05"
                   value={volume}
                   onChange={handleVolumeChange}
                   className="w-16 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                 />
               </div>
            </div>
          )}
        </div>

        {/* Translation Sidebar */}
        <aside className="w-96 border-l border-slate-100 flex flex-col bg-white shrink-0 overflow-y-auto">
          <div className="p-6 flex flex-col gap-8 flex-1">
            {/* Configuration Section */}
            <section>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">Target Language</label>
                  <div className="relative">
                    <select 
                      value={targetLang}
                      onChange={(e) => {
                         setTargetLang(e.target.value);
                         const defaultVoice = VOICES[e.target.value]?.[0]?.id;
                         if (defaultVoice) setSelectedVoiceId(defaultVoice);
                      }}
                      disabled={isProcessing}
                      className="w-full bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-lg py-2.5 px-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {LANGUAGES.map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">Select Voice</label>
                  <div className="relative">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => setIsVoiceSelectOpen(!isVoiceSelectOpen)}
                      className="w-full bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-lg py-2.5 px-3 text-sm flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      <span className="truncate">
                        {VOICES[targetLang]?.find(v => v.id === selectedVoiceId)?.name || 'Select Voice'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-indigo-400" />
                    </button>

                    {isVoiceSelectOpen && !isProcessing && (
                      <div className="absolute top-full mt-1 left-0 right-0 max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl z-50">
                        {VOICES[targetLang]?.map((voice) => (
                          <div 
                            key={voice.id}
                            onClick={() => {
                              setSelectedVoiceId(voice.id);
                              setIsVoiceSelectOpen(false);
                            }}
                            className={cn(
                              "p-3 flex items-start gap-3 cursor-pointer hover:bg-slate-50 border-b border-slate-100 last:border-0",
                              selectedVoiceId === voice.id ? "bg-indigo-50/50" : ""
                            )}
                          >
                            <button
                              type="button"
                              onClick={(e) => playVoicePreview(voice, e)}
                              className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-600 flex items-center justify-center transition-colors"
                            >
                              {playingPreviewId === voice.id ? <Pause className="w-4 h-4 ml-0.5" /> : <Play className="w-4 h-4 ml-0.5" />}
                            </button>
                            <div className="flex-1 min-w-0">
                               <div className="flex items-center justify-between">
                                 <p className="text-sm font-semibold text-slate-800">{voice.name}</p>
                                 {selectedVoiceId === voice.id && <Check className="w-4 h-4 text-indigo-600" />}
                               </div>
                               <p className="text-xs text-slate-500 mt-0.5">{voice.description}</p>
                               <div className="flex items-center gap-2 mt-1.5">
                                  {voice.gender && (
                                     <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                       {voice.gender}
                                     </span>
                                  )}
                                  {voice.accent && (
                                     <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                       {voice.accent}
                                     </span>
                                  )}
                               </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Dubbing Toggle */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">Playback Settings</label>
                  <div className="p-4 border border-slate-100 rounded-xl bg-slate-50 flex items-center justify-between">
                     <span className="text-sm text-slate-600 flex items-center gap-2">
                       {dubbingEnabled ? <Volume2 className="w-4 h-4 text-indigo-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                       AI Dubbing
                     </span>
                     <button 
                        onClick={() => setDubbingEnabled(!dubbingEnabled)}
                        className={cn(
                          "w-8 h-4 rounded-full relative transition-colors border",
                          dubbingEnabled ? "bg-indigo-600 border-indigo-600" : "bg-slate-200 border-slate-300"
                        )}
                     >
                       <div className={cn(
                          "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all border border-slate-100 shadow-sm",
                          dubbingEnabled ? "right-0.5" : "left-0.5"
                       )}></div>
                     </button>
                  </div>
                </div>
              </div>
            </section>

             {/* Status */}
            <section className="flex-1 overflow-hidden flex flex-col">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Status</h3>
               <div className="space-y-4">
                 {globalError && (
                   <div className="p-4 border border-rose-200 rounded-xl bg-rose-50 flex items-start gap-3">
                     <span className="text-rose-500 mt-0.5 shrink-0">
                       <Loader2 className="w-4 h-4 hidden" />
                       <div className="w-5 h-5 bg-rose-100 rounded flex items-center justify-center border border-rose-200">
                         <span className="text-rose-500 font-bold text-[10px]">!</span>
                       </div>
                     </span>
                     <div className="flex-1 min-w-0">
                       <p className="text-sm font-semibold text-rose-800 tracking-tight">API Error</p>
                       <p className="text-xs text-rose-700 mt-1.5 leading-relaxed break-words">{globalError}</p>
                     </div>
                   </div>
                 )}
                 {isProcessing && (
                   <div className="p-4 border border-slate-100 rounded-xl bg-slate-50">
                     <div className="flex items-center gap-3 mb-3">
                       <Loader2 className="w-4 h-4 animate-spin outline-none text-indigo-500" />
                       <span className="text-sm text-slate-600 font-medium tracking-tight">Processing Video...</span>
                     </div>
                     <p className="text-xs text-slate-500 leading-relaxed">
                       Extracting audio, translating via Gemini 2.5 Flash, and synthesizing dubs. This may take a minute.
                     </p>
                   </div>
                 )}
                 {isDownloading && (
                   <div className="p-4 border border-slate-100 rounded-xl bg-slate-50">
                     <div className="flex items-center gap-3 mb-3">
                       <Loader2 className="w-4 h-4 animate-spin outline-none text-indigo-500" />
                       <span className="text-sm text-slate-600 font-medium tracking-tight">Merging Dubbed Video...</span>
                     </div>
                     <p className="text-xs text-slate-500 leading-relaxed">
                       Server is generating the audio layers and interleaving with your original video file.
                     </p>
                   </div>
                 )}
                 {vttUrl && !isProcessing && !isDownloading && (
                   <div className="p-4 border border-emerald-100 rounded-xl bg-emerald-50">
                      <p className="text-sm font-semibold text-emerald-800 tracking-tight">Translation Complete!</p>
                      <p className="text-xs text-emerald-700 mt-2 leading-relaxed">Play the video to see subtitles and hear the AI dubbed speech, or Export to download.</p>
                   </div>
                 )}
                 {!isProcessing && !isDownloading && !vttUrl && file && (
                   <div className="p-4 border border-slate-100 rounded-xl bg-slate-50">
                      <p className="text-xs text-slate-500 leading-relaxed">Ready to translate. Press the button below to start.</p>
                   </div>
                 )}
                 {!file && (
                   <div className="p-4 border border-slate-100 rounded-xl bg-slate-50">
                      <p className="text-xs text-slate-500 leading-relaxed">Waiting for video upload...</p>
                   </div>
                 )}
               </div>
            </section>

          </div>

          {/* Action Buttons */}
          <div className="mt-auto p-6 border-t border-slate-100 flex gap-3 shrink-0 bg-white">
            <button 
              onClick={startTranslation}
              disabled={!file || isProcessing || isDownloading}
              className="flex-1 py-3 bg-slate-900 text-white text-sm font-semibold rounded-xl hold:bg-slate-800 hover:bg-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Run Full Translation
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}
