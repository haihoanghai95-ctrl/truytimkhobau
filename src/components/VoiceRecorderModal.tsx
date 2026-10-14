import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, RotateCcw, Check, X, AlertCircle } from 'lucide-react';

interface VoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAudio: (audioDataUrl: string) => void;
  cardTitle: string;
}

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({
  isOpen,
  onClose,
  onSaveAudio,
  cardTitle
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      cleanup();
    }
  }, [isOpen]);

  const cleanup = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    setIsRecording(false);
    setIsPlaying(false);
    setRecordSeconds(0);
    setAudioBlobUrl(null);
    setAudioBase64(null);
    setErrorMsg(null);
  };

  const startRecording = async () => {
    setErrorMsg(null);
    setAudioBlobUrl(null);
    setAudioBase64(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const blobUrl = URL.createObjectURL(audioBlob);
        setAudioBlobUrl(blobUrl);

        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setAudioBase64(reader.result as string);
        };

        // Stop microphone tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordSeconds(0);

      timerIntervalRef.current = window.setInterval(() => {
        setRecordSeconds(prev => {
          if (prev >= 60) {
            // Cap at 60 seconds
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      setErrorMsg('Không thể truy cập micro. Cô vui lòng kiểm tra quyền micro trên trình duyệt.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  const playPreview = () => {
    if (!audioBlobUrl) return;
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }

    const audio = new Audio(audioBlobUrl);
    audioElementRef.current = audio;
    setIsPlaying(true);

    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
    audio.play().catch(() => setIsPlaying(false));
  };

  const handleSave = () => {
    if (audioBase64) {
      onSaveAudio(audioBase64);
      onClose();
    }
  };

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border-2 border-amber-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
            <Mic className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Ghi Âm Giọng Cô</h3>
          <p className="text-sm text-slate-500 mt-1">
            Đọc tên hoặc lời thoại cho hình ảnh: <span className="font-semibold text-amber-700">"{cardTitle}"</span>
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Visual Record State */}
        <div className="flex flex-col items-center justify-center p-6 bg-amber-50/50 rounded-2xl border border-amber-100 mb-6">
          <div className="text-3xl font-mono font-bold text-slate-800 mb-4 tabular-nums">
            {formatTime(recordSeconds)}
          </div>

          {!isRecording && !audioBlobUrl && (
            <button
              onClick={startRecording}
              className="flex items-center gap-2 px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-full shadow-lg hover:shadow-rose-300/50 transition-all active:scale-95"
            >
              <Mic className="w-5 h-5" />
              Bắt đầu ghi âm
            </button>
          )}

          {isRecording && (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-rose-600 font-semibold text-sm">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                Đang thu âm giọng cô...
              </div>
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-full shadow-lg transition-all active:scale-95"
              >
                <Square className="w-5 h-5 fill-current" />
                Dừng ghi âm
              </button>
            </div>
          )}

          {!isRecording && audioBlobUrl && (
            <div className="flex items-center gap-3">
              <button
                onClick={playPreview}
                disabled={isPlaying}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-full shadow transition-all active:scale-95 disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                {isPlaying ? 'Đang phát...' : 'Nghe lại'}
              </button>
              <button
                onClick={startRecording}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold rounded-full transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Ghi âm lại
              </button>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={!audioBase64}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            Lưu bản ghi âm
          </button>
        </div>
      </div>
    </div>
  );
};
