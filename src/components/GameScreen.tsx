import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaceTheme, FacePart, TargetRegion, DifficultyLevel, MaskStyle } from '../types';
import { MagnifyingGlassCanvas } from './MagnifyingGlassCanvas';
import { soundEffects } from '../services/soundEffects';
import { speechService } from '../services/speechSynthesis';
import { fireCelebrationConfetti } from '../services/confetti';
import {
  Eye,
  RotateCcw,
  ArrowRight,
  Volume2,
  Sparkles,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Settings2,
  Play,
  Smile,
  ArrowUpLeft,
  EyeOff,
  AlertCircle
} from 'lucide-react';

interface GameScreenProps {
  theme: FaceTheme;
  difficulty: DifficultyLevel;
  maskStyle: MaskStyle;
  ttsRate: number;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onBackToThemes: () => void;
  onOpenTeacherAdmin: () => void;
  onChangeDifficulty: (diff: DifficultyLevel) => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  theme,
  difficulty,
  maskStyle,
  ttsRate,
  isFullscreen,
  onToggleFullscreen,
  onBackToThemes,
  onOpenTeacherAdmin,
  onChangeDifficulty
}) => {
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [isFullRevealed, setIsFullRevealed] = useState(false);
  const [highlightedPart, setHighlightedPart] = useState<FacePart | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [outOfBoundsNotice, setOutOfBoundsNotice] = useState<string | null>(null);

  // Track the current virtual position of the magnifying glass
  const currentLensPosRef = useRef<{ x: number; y: number }>({ x: 350, y: 250 });

  // Track discovered parts
  const [discoveredPartIds, setDiscoveredPartIds] = useState<Set<string>>(new Set());

  const currentPart = (theme && Array.isArray(theme.parts) && theme.parts[currentPartIndex]) || null;

  // Lens radius based on difficulty
  const getLensRadius = (diff: DifficultyLevel) => {
    switch (diff) {
      case 'easy':
        return 145; // Broad lens for toddlers 12-36 months
      case 'medium':
        return 100;
      case 'hard':
        return 70;
    }
  };

  const getMagnification = (diff: DifficultyLevel) => {
    switch (diff) {
      case 'easy':
        return 1.35; // 1.35x optical zoom for toddlers
      case 'medium':
        return 1.40; // 1.40x
      case 'hard':
        return 1.45; // 1.45x
    }
  };

  // Safe region extractor to support older storage models and custom cards
  const getSafePartRegions = (part: FacePart | null | undefined): TargetRegion[] => {
    if (!part) return [];
    const nameLower = (part.name || '').toLowerCase();
    const idLower = (part.id || '').toLowerCase();

    // ĐÔI MẮT: Always ensure BOTH eye regions exist
    if (nameLower.includes('mắt') || idLower.includes('eye')) {
      if (Array.isArray(part.regions) && part.regions.length >= 2) {
        return part.regions;
      }
      if (Array.isArray(part.regions) && part.regions.length === 1) {
        const r1 = part.regions[0];
        const r2X = r1.x < 350 ? 410 : 290;
        return [r1, { x: r2X, y: r1.y, radius: r1.radius || 55 }];
      }
      return [
        { x: 290, y: 250, radius: 55 },
        { x: 410, y: 250, radius: 55 }
      ];
    }

    // ĐÔI TAI: Always ensure BOTH ear regions exist
    if (nameLower.includes('tai') || idLower.includes('ear')) {
      if (Array.isArray(part.regions) && part.regions.length >= 2) {
        return part.regions;
      }
      if (Array.isArray(part.regions) && part.regions.length === 1) {
        const r1 = part.regions[0];
        const r2X = r1.x < 350 ? 520 : 180;
        return [r1, { x: r2X, y: r1.y, radius: r1.radius || 58 }];
      }
      return [
        { x: 180, y: 280, radius: 58 },
        { x: 520, y: 280, radius: 58 }
      ];
    }

    // CÁI MŨI
    if (nameLower.includes('mũi') || idLower.includes('nose')) {
      if (Array.isArray(part.regions) && part.regions.length > 0) return part.regions;
      return [{ x: 350, y: 325, radius: 55 }];
    }

    // CÁI MIỆNG
    if (nameLower.includes('miệng') || idLower.includes('mouth')) {
      if (Array.isArray(part.regions) && part.regions.length > 0) return part.regions;
      return [{ x: 350, y: 405, radius: 68 }];
    }

    if (Array.isArray(part.regions) && part.regions.length > 0) return part.regions;
    return [{ x: 350, y: 300, radius: 55 }];
  };

  // Helper: Find which facial feature is closest to the lens position
  const detectPartAtLens = useCallback((): FacePart | null => {
    const { x, y } = currentLensPosRef.current;
    const lensRadius = getLensRadius(difficulty);

    let matchedPart: FacePart | null = null;
    let minDistance = Infinity;

    const parts = theme?.parts || [];
    for (const part of parts) {
      if (!part) continue;
      const regions = getSafePartRegions(part);
      for (const region of regions) {
        if (!region || typeof region.x !== 'number' || typeof region.y !== 'number') continue;
        const dx = x - region.x;
        const dy = y - region.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // If the lens circle overlaps with the feature region
        const threshold = lensRadius + (region.radius || 50) * 0.4;
        if (dist <= threshold && dist < minDistance) {
          minDistance = dist;
          matchedPart = {
            ...part,
            regions
          };
        }
      }
    }

    return matchedPart;
  }, [theme?.parts, difficulty]);

  // Clean audio on unmount
  useEffect(() => {
    return () => {
      speechService.stopAll();
    };
  }, []);

  // Audio Playback for a part
  const playPartAudio = useCallback((part: FacePart) => {
    setIsPlayingAudio(true);
    setVoiceNotice(null);

    // Mode 1: Custom audio file or voice recording
    if (part.audioUrl && part.audioMode === 'upload_first') {
      speechService
        .playAudioUrl(
          part.audioUrl,
          () => setIsPlayingAudio(false),
          () => playPartTTS(part)
        )
        .catch(() => playPartTTS(part));
      return;
    }

    // Mode 2: TTS
    playPartTTS(part);
  }, [ttsRate]);

  const playPartTTS = (part: FacePart) => {
    // Strictly read unified names: "Đôi mắt", "Cái mũi", "Cái miệng", "Đôi tai"
    let text = part.spokenName || part.name;
    const nameLower = (part.name || '').toLowerCase();
    const idLower = (part.id || '').toLowerCase();
    if (nameLower.includes('mắt') || idLower.includes('eye')) {
      text = 'Đôi mắt';
    } else if (nameLower.includes('tai') || idLower.includes('ear')) {
      text = 'Đôi tai';
    } else if (nameLower.includes('mũi') || idLower.includes('nose')) {
      text = 'Cái mũi';
    } else if (nameLower.includes('miệng') || idLower.includes('mouth')) {
      text = 'Cái miệng';
    }

    const success = speechService.speakVietnamese(
      text,
      0.9, // Gentle slow pace for toddlers 12-36 months
      1.05,
      () => setIsPlayingAudio(false),
      () => {
        setIsPlayingAudio(false);
        setVoiceNotice(
          'Thiết bị chưa có giọng đọc tiếng Việt (vi-VN). Cô có thể dùng tính năng "Ghi âm trực tiếp bằng micro" trong Kho chủ đề để thu âm giọng cô!'
        );
      }
    );
    if (!success) setIsPlayingAudio(false);
  };

  // Audio Playback for full face / completed celebration
  const playFullFaceAudio = () => {
    setIsPlayingAudio(true);
    const text = theme.fullFaceDescription || 'Các bé giỏi quá! Đây là khuôn mặt đáng yêu của bé. Trên khuôn mặt có đôi mắt, cái mũi, cái miệng và đôi tai!';
    const success = speechService.speakVietnamese(
      text,
      0.9,
      1.05,
      () => setIsPlayingAudio(false),
      () => {
        setIsPlayingAudio(false);
      }
    );
    if (!success) setIsPlayingAudio(false);
  };

  // Button 1: "BẮT ĐẦU"
  const handleStart = () => {
    soundEffects.playPop();
    speechService.stopAll();
    setIsFullRevealed(false);
    setHighlightedPart(null);
    setIsPlayingAudio(false);
    setOutOfBoundsNotice(null);
  };

  // Button 2: "HIỆN ĐÁP ÁN" (Chỉ xác định và công bố bộ phận kính lúp đang soi thực tế!)
  const handleRevealAnswer = () => {
    soundEffects.playPop();
    setOutOfBoundsNotice(null);

    // 1. Detect which facial part is being inspected by the magnifying glass
    const partToReveal = detectPartAtLens();

    // If lens is not inspecting any part (e.g. empty background or margin)
    if (!partToReveal) {
      soundEffects.playSearchTwinkle();
      const message = 'Kính lúp chưa soi trúng bộ phận nào. Cô và bé hãy kéo kính lúp vào Đôi mắt, Cái mũi, Cái miệng hoặc Đôi tai của bé nhé!';
      setOutOfBoundsNotice(message);
      speechService.speakVietnamese(
        'Kính lúp chưa soi trúng bộ phận nào. Cô và bé hãy kéo kính lúp vào mắt, mũi, miệng hoặc tai nhé!',
        0.9,
        1.05
      );
      return;
    }

    // 2. Play celebratory fanfare
    soundEffects.playRevealFanfare();
    setIsFullRevealed(false);
    setHighlightedPart(partToReveal);

    // Update discovered parts
    const nextDiscovered = new Set(discoveredPartIds);
    nextDiscovered.add(partToReveal.id);
    setDiscoveredPartIds(nextDiscovered);

    // Update index to match revealed part
    const partIdx = Array.isArray(theme?.parts) ? theme.parts.findIndex(p => p && p.id === partToReveal.id) : -1;
    if (partIdx >= 0) {
      setCurrentPartIndex(partIdx);
    }

    // 3. Play audio: "Đôi mắt!", "Cái mũi!", "Cái miệng!", "Đôi tai!"
    setTimeout(() => {
      playPartAudio(partToReveal);
    }, 350);

    // 4. If all parts have been discovered, trigger grand full face reveal celebration!
    const partsCount = Array.isArray(theme?.parts) ? theme.parts.length : 4;
    if (nextDiscovered.size >= partsCount) {
      setTimeout(() => {
        handleRevealFullFace();
      }, 3500);
    }
  };

  // Button 3: "ẨN ĐÁP ÁN" (Quay về trạng thái khám phá)
  const handleHideAnswer = () => {
    soundEffects.playPop();
    speechService.stopAll();
    setHighlightedPart(null);
    setIsFullRevealed(false);
    setIsPlayingAudio(false);
  };

  // Button 4: "TIẾP TỤC" (Chuyển đến bộ phận tiếp theo)
  const handleNextPart = () => {
    soundEffects.playWhoosh();
    speechService.stopAll();
    setHighlightedPart(null);
    setIsFullRevealed(false);
    setIsPlayingAudio(false);
    setOutOfBoundsNotice(null);

    const partsCount = Array.isArray(theme?.parts) ? theme.parts.length : 0;
    if (partsCount > 0 && currentPartIndex < partsCount - 1) {
      setCurrentPartIndex(prev => prev + 1);
    } else {
      setCurrentPartIndex(0);
    }
  };

  // Button 5: "CHƠI LẠI" (Đặt lại toàn bộ trò chơi)
  const handleResetGame = () => {
    soundEffects.playPop();
    speechService.stopAll();
    setIsFullRevealed(false);
    setHighlightedPart(null);
    setIsPlayingAudio(false);
    setCurrentPartIndex(0);
    setDiscoveredPartIds(new Set());
    setOutOfBoundsNotice(null);
  };

  // Button 6: "NGHE LẠI"
  const handleReplayAudio = () => {
    soundEffects.playPop();
    if (isFullRevealed) {
      playFullFaceAudio();
    } else if (highlightedPart) {
      playPartAudio(highlightedPart);
    } else if (currentPart) {
      playPartAudio(currentPart);
    }
  };

  // Button 7: "HIỆN TOÀN BỘ"
  const handleRevealFullFace = () => {
    soundEffects.playRevealFanfare();
    fireCelebrationConfetti();
    setHighlightedPart(null);
    setIsFullRevealed(true);
    setOutOfBoundsNotice(null);

    setTimeout(() => {
      playFullFaceAudio();
    }, 400);
  };

  // Direct quick select
  const handleSelectPart = (idx: number) => {
    soundEffects.playPop();
    speechService.stopAll();
    setHighlightedPart(null);
    setIsFullRevealed(false);
    setOutOfBoundsNotice(null);
    setCurrentPartIndex(idx);
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-3 space-y-3.5 animate-fade-in">
      {/* Top Bar for Classroom Presentation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-amber-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundEffects.playPop();
              speechService.stopAll();
              onBackToThemes();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs sm:text-sm font-bold transition-colors"
          >
            <ArrowUpLeft className="w-4 h-4" />
            <span>Chọn bài học</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-2xl">{theme.icon}</span>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 line-clamp-1">
                TRUY TÌM KHO BÁU – KHÁM PHÁ KHUÔN MẶT
              </h2>
              <span className="text-[11px] font-bold text-amber-700">
                Đang khám phá: <strong className="text-amber-900 uppercase">{currentPart?.name || 'Khuôn mặt'}</strong> ({currentPartIndex + 1}/{Array.isArray(theme?.parts) ? theme.parts.length : 4})
              </span>
            </div>
          </div>
        </div>

        {/* Action icons & settings */}
        <div className="flex items-center gap-2">
          {/* Difficulty selector */}
          <div className="flex items-center gap-1 bg-amber-50 p-1 rounded-xl border border-amber-200/60">
            {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map(diff => (
              <button
                key={diff}
                onClick={() => {
                  soundEffects.playPop();
                  onChangeDifficulty(diff);
                }}
                className={`px-2 py-0.5 text-xs font-bold rounded-lg transition-all ${
                  difficulty === diff
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'text-amber-800 hover:bg-amber-100'
                }`}
              >
                {diff === 'easy' ? 'Kính to (12-36m)' : diff === 'medium' ? 'Kính vừa' : 'Kính nhỏ'}
              </button>
            ))}
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình trình chiếu'}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Teacher Mode Button */}
          <button
            onClick={onOpenTeacherAdmin}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kho chủ đề của giáo viên</span>
          </button>
        </div>
      </div>

      {/* 4 Standard Features Strip (ĐÔI MẮT, CÁI MŨI, CÁI MIỆNG, ĐÔI TAI) */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1">
        {Array.isArray(theme?.parts) && theme.parts.map((p, idx) => {
          if (!p) return null;
          const isCurrent = idx === currentPartIndex;
          const isDiscovered = discoveredPartIds.has(p.id);
          return (
            <button
              key={p.id || idx}
              onClick={() => handleSelectPart(idx)}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-1.5 ${
                isCurrent
                  ? 'bg-amber-500 text-white shadow-md scale-105'
                  : isDiscovered
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-white hover:bg-amber-50 text-slate-700 border border-amber-200'
              }`}
            >
              {isDiscovered && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              <span>{p.name}</span>
            </button>
          );
        })}
      </div>

      {/* Voice Warning Notice if browser lacks vi-VN voice */}
      {voiceNotice && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs flex items-center justify-between gap-2 animate-fade-in">
          <span>{voiceNotice}</span>
          <button
            onClick={() => setVoiceNotice(null)}
            className="px-2.5 py-1 bg-amber-200 rounded-lg font-bold"
          >
            Đã hiểu
          </button>
        </div>
      )}

      {/* Out of bounds gentle hint for teacher */}
      {outOfBoundsNotice && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{outOfBoundsNotice}</span>
          </div>
          <button
            onClick={() => setOutOfBoundsNotice(null)}
            className="px-2.5 py-1 bg-rose-200 text-rose-900 rounded-lg font-bold"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Teacher Prompt Banner: “Các con nhìn xem, đây là gì nào?” */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-2xl border border-amber-200/80">
        <div className="flex items-center gap-2 text-amber-950 font-black text-xs sm:text-sm">
          <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Cô hỏi trẻ: &ldquo;Các con nhìn xem kính lúp đang soi vào đâu đây nào?&rdquo;
          </span>
        </div>

        {currentPart?.hint && (
          <button
            onClick={() => {
              soundEffects.playPop();
              setShowHint(!showHint);
            }}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-800 bg-white/80 hover:bg-white rounded-lg border border-amber-200 shadow-2xs transition-colors"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>{showHint ? 'Ẩn gợi ý' : 'Gợi ý cho cô'}</span>
          </button>
        )}
      </div>

      {showHint && currentPart?.hint && (
        <div className="p-3 bg-yellow-50 border-2 border-yellow-300 rounded-2xl text-xs sm:text-sm text-yellow-950 font-semibold animate-fade-in">
          💡 <span className="font-bold">Gợi mở cho trẻ nhận biết:</span> {currentPart.hint}
        </div>
      )}

      {/* Central Big Face Stage with Canvas Magnifying Glass */}
      <div className="relative">
        <MagnifyingGlassCanvas
          faceImageUrl={theme.faceImageUrl}
          isFullRevealed={isFullRevealed}
          highlightedPart={highlightedPart}
          lensRadius={getLensRadius(difficulty)}
          magnification={getMagnification(difficulty)}
          maskStyle={maskStyle}
          onStartDrag={() => {
            if (highlightedPart) {
              setHighlightedPart(null);
            }
            setOutOfBoundsNotice(null);
          }}
          onLensMove={(coords) => {
            currentLensPosRef.current = coords;
          }}
        />
      </div>

      {/* ANSWER BANNER: DISPLAY LARGE TEXT (ĐÔI MẮT, CÁI MŨI, CÁI MIỆNG, ĐÔI TAI) */}
      {highlightedPart && !isFullRevealed && (
        <div className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 p-4 sm:p-5 rounded-3xl border-4 border-white shadow-xl text-center space-y-1.5 animate-bounce-subtle">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 text-amber-900 text-xs font-black">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Bé Đoán Rất Giỏi!</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-amber-950 tracking-tight uppercase">
            {highlightedPart.name}
          </h1>

          <p className="text-sm sm:text-base text-amber-900/95 font-bold max-w-2xl mx-auto leading-relaxed">
            {highlightedPart.description}
          </p>
        </div>
      )}

      {/* FULL FACE REVEAL BANNER (AFTER ALL 4 PARTS EXPLORED) */}
      {isFullRevealed && (
        <div className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 p-4 sm:p-5 rounded-3xl border-4 border-white shadow-xl text-center space-y-1.5 animate-bounce-subtle">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 text-emerald-900 text-xs font-black">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Hoan Hô Các Bé!</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-emerald-950 tracking-tight">
            KHUÔN MẶT CỦA BÉ
          </h1>

          <p className="text-sm sm:text-base text-emerald-950/90 font-bold max-w-2xl mx-auto leading-relaxed">
            {theme.fullFaceDescription}
          </p>
        </div>
      )}

      {/* ALL REQUIRED INTERACTIVE BUTTONS BAR (CLEAR, LARGE, INTUITIVE) */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-lg border-2 border-amber-200">
        <div className="flex flex-wrap items-center justify-center sm:justify-between gap-2.5">
          {/* Left Actions: Bắt đầu & Chơi lại & Ẩn đáp án */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleStart}
              title="Bắt đầu từ đầu"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-extrabold text-xs sm:text-sm transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Bắt đầu</span>
            </button>

            {highlightedPart && (
              <button
                onClick={handleHideAnswer}
                title="Ẩn đáp án để tiếp tục khám phá"
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs sm:text-sm transition-all active:scale-95"
              >
                <EyeOff className="w-4 h-4" />
                <span>Ẩn đáp án</span>
              </button>
            )}

            <button
              onClick={handleResetGame}
              title="Đặt lại toàn bộ trò chơi"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs sm:text-sm transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Chơi lại</span>
            </button>
          </div>

          {/* Center Main Action Buttons: HIỆN ĐÁP ÁN & HIỆN TOÀN BỘ */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRevealAnswer}
              className="flex items-center justify-center gap-2 py-3 px-5 sm:px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm sm:text-base shadow-md shadow-amber-500/30 hover:scale-102 active:scale-95 transition-all"
            >
              <Eye className="w-5 h-5 animate-pulse" />
              <span>Hiện đáp án</span>
            </button>

            <button
              onClick={handleRevealFullFace}
              className="flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm sm:text-base shadow-md shadow-emerald-500/30 hover:scale-102 active:scale-95 transition-all"
            >
              <Smile className="w-5 h-5" />
              <span>Hiện khuôn mặt</span>
            </button>
          </div>

          {/* Right Actions: Nghe lại & Tiếp tục */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleReplayAudio}
              disabled={isPlayingAudio}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-extrabold text-xs sm:text-sm transition-all active:scale-95 disabled:opacity-50"
            >
              <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-bounce' : ''}`} />
              <span>Nghe lại</span>
            </button>

            <button
              onClick={handleNextPart}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-95"
            >
              <span>Tiếp tục</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
