import React, { useState, useRef } from 'react';
import { FaceTheme, FacePart, TargetRegion, AppSettings } from '../types';
import { storageService } from '../services/storage';
import { soundEffects } from '../services/soundEffects';
import { speechService } from '../services/speechSynthesis';
import { VoiceRecorderModal } from './VoiceRecorderModal';
import { svgBabyFace, svgGirlFace, createSvgDataUrl, STANDARD_FACE_PARTS } from '../services/sampleData';
import {
  Plus,
  Play,
  Copy,
  Trash2,
  Edit,
  ArrowUp,
  ArrowDown,
  Volume2,
  Mic,
  Upload,
  Download,
  Check,
  AlertTriangle,
  FolderOpen,
  MapPin,
  Sparkles,
  Layers,
  CircleDot,
  Cloud,
  LogIn
} from 'lucide-react';
import { User } from '../services/firebase';

interface TeacherAdminProps {
  themes: FaceTheme[];
  settings: AppSettings;
  onThemesUpdated: (themes: FaceTheme[]) => void;
  onSettingsUpdated: (settings: AppSettings) => void;
  onPlayTheme: (theme: FaceTheme) => void;
  onBackToHome: () => void;
  currentUser?: User | null;
  onSignInGoogle?: () => void;
  onSyncCloud?: () => Promise<void>;
}

export const TeacherAdmin: React.FC<TeacherAdminProps> = ({
  themes,
  settings,
  onThemesUpdated,
  onSettingsUpdated,
  onPlayTheme,
  onBackToHome,
  currentUser,
  onSignInGoogle,
  onSyncCloud
}) => {
  const [selectedThemeId, setSelectedThemeId] = useState<string>(themes[0]?.id || '');
  const [isEditingThemeModal, setIsEditingThemeModal] = useState(false);
  const [themeForm, setThemeForm] = useState<{
    id?: string;
    title: string;
    category: string;
    icon: string;
    faceImageUrl: string;
    fullFaceDescription: string;
  }>({
    title: '',
    category: 'Nhận biết các bộ phận khuôn mặt (12–36 tháng)',
    icon: '👶',
    faceImageUrl: createSvgDataUrl(svgBabyFace),
    fullFaceDescription: 'Các bé giỏi quá! Đây là khuôn mặt đáng yêu của bé. Trên khuôn mặt có đôi mắt, cái mũi, cái miệng và đôi tai!'
  });

  // Part editor state
  const [isEditingPartModal, setIsEditingPartModal] = useState(false);
  const [editingPart, setEditingPart] = useState<FacePart | null>(null);
  const [activeRegionIndex, setActiveRegionIndex] = useState(0);

  // Voice recorder modal
  const [isVoiceRecorderOpen, setIsVoiceRecorderOpen] = useState(false);

  // Delete confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'theme' | 'part';
    id: string;
    title: string;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileImportRef = useRef<HTMLInputElement>(null);
  const faceUploadRef = useRef<HTMLInputElement>(null);

  const selectedTheme = themes.find(t => t.id === selectedThemeId) || themes[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // --- THEME HANDLERS ---
  const handleOpenNewThemeModal = () => {
    setThemeForm({
      title: '',
      category: 'Khám phá mầm non',
      icon: '🌟',
      faceImageUrl: createSvgDataUrl(svgBabyFace),
      fullFaceDescription: 'Các bé giỏi quá! Đây là khuôn mặt đáng yêu của bé.'
    });
    setIsEditingThemeModal(true);
  };

  const handleOpenEditThemeModal = (theme: FaceTheme) => {
    setThemeForm({
      id: theme.id,
      title: theme.title,
      category: theme.category,
      icon: theme.icon,
      faceImageUrl: theme.faceImageUrl,
      fullFaceDescription: theme.fullFaceDescription || ''
    });
    setIsEditingThemeModal(true);
  };

  const handleSaveTheme = async () => {
    if (!themeForm.title.trim()) {
      showToast('Vui lòng nhập tên bài học.');
      return;
    }

    if (themeForm.id) {
      const existing = themes.find(t => t.id === themeForm.id);
      if (existing) {
        const updated: FaceTheme = {
          ...existing,
          title: themeForm.title.trim(),
          category: themeForm.category.trim(),
          icon: themeForm.icon.trim() || '👶',
          faceImageUrl: themeForm.faceImageUrl,
          fullFaceDescription: themeForm.fullFaceDescription.trim(),
          updatedAt: Date.now()
        };
        await storageService.saveTheme(updated);
        const refreshed = await storageService.getAllThemes();
        onThemesUpdated(refreshed);
        showToast('Đã cập nhật bài học!');
      }
    } else {
      // Create new with standard 4 preschool parts
      const newTheme: FaceTheme = {
        id: `face-${Date.now()}`,
        title: themeForm.title.trim(),
        category: themeForm.category.trim(),
        icon: themeForm.icon.trim() || '👶',
        faceImageUrl: themeForm.faceImageUrl,
        fullFaceDescription: themeForm.fullFaceDescription.trim(),
        isCustom: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        parts: STANDARD_FACE_PARTS.map(p => ({
          ...p,
          id: `part-${Date.now()}-${p.id}`
        }))
      };
      await storageService.saveTheme(newTheme);
      const refreshed = await storageService.getAllThemes();
      onThemesUpdated(refreshed);
      setSelectedThemeId(newTheme.id);
      showToast('Đã tạo bài học mới thành công!');
    }

    setIsEditingThemeModal(false);
  };

  const handleCloneTheme = async (themeId: string) => {
    const cloned = await storageService.cloneTheme(themeId);
    if (cloned) {
      const refreshed = await storageService.getAllThemes();
      onThemesUpdated(refreshed);
      setSelectedThemeId(cloned.id);
      showToast(`Đã nhân bản bài giảng "${cloned.title}"!`);
    }
  };

  const handleDeleteThemeConfirm = async (themeId: string) => {
    await storageService.deleteTheme(themeId);
    const refreshed = await storageService.getAllThemes();
    onThemesUpdated(refreshed);
    if (refreshed.length > 0) {
      setSelectedThemeId(refreshed[0].id);
    }
    setDeleteConfirmation(null);
    showToast('Đã xóa bài học.');
  };

  // Face image upload
  const handleFacePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const originalDataUrl = event.target?.result as string;
      const img = new Image();
      img.src = originalDataUrl;

      img.onload = () => {
        const maxDim = 800;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          setThemeForm(prev => ({
            ...prev,
            faceImageUrl: canvas.toDataURL('image/webp', 0.88)
          }));
        } else {
          setThemeForm(prev => ({
            ...prev,
            faceImageUrl: originalDataUrl
          }));
        }
        showToast('Đã tải hình ảnh bài học lên thành công!');
      };
    };
    reader.readAsDataURL(file);
  };

  // --- PART HANDLERS ---
  const handleOpenAddPartModal = () => {
    setEditingPart({
      id: `part-${Date.now()}`,
      name: '',
      spokenName: '',
      description: '',
      audioMode: 'upload_first',
      hint: '',
      regions: [
        { x: 350, y: 300, radius: 55 }
      ]
    });
    setIsEditingPartModal(true);
  };

  const handleOpenEditPartModal = (part: FacePart) => {
    // Ensure regions array exists
    const regions = part.regions && part.regions.length > 0
      ? part.regions
      : [{ x: part.targetX || 350, y: part.targetY || 300, radius: part.radius || 55 }];

    setEditingPart({
      ...part,
      regions
    });
    setIsEditingPartModal(true);
  };

  const handleSavePart = async () => {
    if (!editingPart || !selectedTheme) return;
    if (!editingPart.name.trim()) {
      showToast('Vui lòng nhập tên đáp án (ví dụ: Đôi mắt, Cái mũi, Cái miệng, Đôi tai).');
      return;
    }

    const parts = [...(selectedTheme.parts || [])];
    const existingIndex = parts.findIndex(p => p.id === editingPart.id);

    const nameTrimmed = editingPart.name.trim();
    const finalizedPart: FacePart = {
      ...editingPart,
      name: nameTrimmed,
      spokenName: editingPart.spokenName?.trim() || `${nameTrimmed}!`,
      description: editingPart.description.trim() || `${nameTrimmed}!`,
      hint: editingPart.hint?.trim(),
      regions: editingPart.regions && editingPart.regions.length > 0 ? editingPart.regions : [{ x: 350, y: 300, radius: 55 }]
    };

    if (existingIndex >= 0) {
      parts[existingIndex] = finalizedPart;
    } else {
      parts.push(finalizedPart);
    }

    const updatedTheme: FaceTheme = {
      ...selectedTheme,
      parts,
      updatedAt: Date.now()
    };

    await storageService.saveTheme(updatedTheme);
    const refreshed = await storageService.getAllThemes();
    onThemesUpdated(refreshed);
    setIsEditingPartModal(false);
    setEditingPart(null);
    showToast('Đã lưu đáp án thành công!');
  };

  const handleDeletePartConfirm = async (partId: string) => {
    if (!selectedTheme) return;
    const parts = (selectedTheme.parts || []).filter(p => p.id !== partId);
    const updatedTheme: FaceTheme = {
      ...selectedTheme,
      parts,
      updatedAt: Date.now()
    };
    await storageService.saveTheme(updatedTheme);
    const refreshed = await storageService.getAllThemes();
    onThemesUpdated(refreshed);
    setDeleteConfirmation(null);
    showToast('Đã xóa đáp án.');
  };

  const handleMovePart = async (index: number, direction: 'up' | 'down') => {
    if (!selectedTheme) return;
    const parts = [...(selectedTheme.parts || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= parts.length) return;

    const temp = parts[index];
    parts[index] = parts[targetIndex];
    parts[targetIndex] = temp;

    const updatedTheme: FaceTheme = {
      ...selectedTheme,
      parts,
      updatedAt: Date.now()
    };
    await storageService.saveTheme(updatedTheme);
    const refreshed = await storageService.getAllThemes();
    onThemesUpdated(refreshed);
  };

  // Audio test
  const handleTestPartAudio = (part: FacePart) => {
    if (part.audioUrl && part.audioMode === 'upload_first') {
      speechService.playAudioUrl(part.audioUrl);
    } else {
      speechService.speakVietnamese(part.spokenName || part.name, 0.9);
    }
  };

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingPart) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const audioUrl = event.target?.result as string;
      setEditingPart({
        ...editingPart,
        audioUrl,
        audioMode: 'upload_first'
      });
      showToast('Đã nạp file âm thanh thành công!');
    };
    reader.readAsDataURL(file);
  };

  // Export / Import
  const handleExportBackup = async () => {
    const jsonStr = await storageService.exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kho_chu_de_mam_non_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất file sao lưu kho bài học về máy!');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const res = await storageService.importBackup(content);
      if (res.success) {
        const refreshed = await storageService.getAllThemes();
        onThemesUpdated(refreshed);
        if (refreshed.length > 0) setSelectedThemeId(refreshed[0].id);
        showToast(`Đã khôi phục thành công ${res.count} bài học!`);
      } else {
        alert(res.error || 'Lỗi khi nhập tệp sao lưu.');
      }
    };
    reader.readAsText(file);
  };

  // Click on Face Image to add/move regions
  const handleFacePinClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editingPart) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 800);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 600);

    // If part currently has 0 regions, add one
    if (editingPart.regions.length === 0) {
      setEditingPart({
        ...editingPart,
        regions: [{ x, y, radius: 55 }]
      });
      return;
    }

    // If it's "Đôi mắt" or "Đôi tai" and has 1 region, clicking adds the 2nd region (pair support!)
    if (editingPart.regions.length === 1 && (editingPart.name.includes('Đôi') || editingPart.name.includes('đôi'))) {
      setEditingPart({
        ...editingPart,
        regions: [...editingPart.regions, { x, y, radius: 55 }]
      });
      showToast('Đã thêm vị trí thứ 2 cho bộ phận đôi!');
      return;
    }

    // Otherwise, move the primary region closest to click
    const updated = editingPart.regions.map((reg, idx) => {
      if (idx === 0) return { ...reg, x, y };
      return reg;
    });

    setEditingPart({
      ...editingPart,
      regions: updated
    });
  };

  const handleAddSecondRegion = () => {
    if (!editingPart) return;
    setEditingPart({
      ...editingPart,
      regions: [...editingPart.regions, { x: 420, y: 250, radius: 55 }]
    });
    showToast('Đã thêm vùng nhận biết thứ 2 (dành cho Đôi mắt / Đôi tai). Hãy bấm vào ảnh để di chuyển vị trí!');
  };

  const handleRemoveRegion = (idx: number) => {
    if (!editingPart || editingPart.regions.length <= 1) return;
    const updated = editingPart.regions.filter((_, i) => i !== idx);
    setEditingPart({
      ...editingPart,
      regions: updated
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-6 animate-fade-in">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-sm font-bold border border-slate-700 animate-slide-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-amber-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Khu Vực Quản Lý Bài Giảng Mầm Non</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Kho Chủ Đề Của Giáo Viên
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Tự do thêm bài học, tải hình ảnh, ghi âm giọng cô, thiết lập nhiều vùng nhận diện (Đôi mắt, Đôi tai) và sao lưu bài giảng
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="file"
            ref={fileImportRef}
            onChange={handleImportBackup}
            accept=".json,application/json"
            className="hidden"
          />
          <button
            onClick={() => fileImportRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Nhập tệp sao lưu</span>
          </button>

          <button
            onClick={handleExportBackup}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Sao lưu kho chủ đề</span>
          </button>

          <button
            onClick={async () => {
              if (!currentUser) {
                onSignInGoogle?.();
              } else {
                showToast('Đang đồng bộ với đám mây Firebase...');
                if (onSyncCloud) {
                  await onSyncCloud();
                } else {
                  const synced = await storageService.syncWithFirestore();
                  onThemesUpdated(synced);
                }
                showToast('Đã đồng bộ bài học lên đám mây Firebase thành công! ✨');
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs shadow-2xs transition-colors"
          >
            <Cloud className="w-3.5 h-3.5 text-amber-600" />
            <span>{currentUser ? 'Đồng bộ Firebase' : 'Đăng nhập lưu Đám mây'}</span>
          </button>

          <button
            onClick={onBackToHome}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95"
          >
            <span>Về Màn Hình Trò Chơi</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Themes List (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl p-5 border-2 border-amber-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-amber-500" />
                <span>Danh Sách Chủ Đề ({themes.length})</span>
              </h2>
              <button
                onClick={handleOpenNewThemeModal}
                className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-xl transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tạo mới</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {themes.map(th => {
                const isSelected = th.id === selectedThemeId;
                return (
                  <div
                    key={th.id}
                    onClick={() => {
                      soundEffects.playPop();
                      setSelectedThemeId(th.id);
                    }}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/80 shadow-xs'
                        : 'border-slate-100 hover:border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center p-0.5 shrink-0 shadow-inner">
                        <img src={th.faceImageUrl} alt={th.title} className="w-full h-full object-contain" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {th.title}
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          {Array.isArray(th.parts) ? th.parts.length : 0} đáp án {th.isCustom ? '· Tự tạo' : '· Mẫu sẵn'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCloneTheme(th.id);
                        }}
                        title="Nhân bản chủ đề"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditThemeModal(th);
                        }}
                        title="Chỉnh sửa chủ đề"
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-white rounded-lg transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      {themes.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmation({
                              type: 'theme',
                              id: th.id,
                              title: th.title
                            });
                          }}
                          title="Xóa chủ đề"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Answers/Parts in Selected Theme (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedTheme ? (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-amber-200 shadow-sm space-y-6">
              {/* Selected Theme Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 border-2 border-amber-200 overflow-hidden flex items-center justify-center p-1 shrink-0 shadow-inner">
                    <img src={selectedTheme.faceImageUrl} alt={selectedTheme.title} className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-slate-900">
                        {selectedTheme.title}
                      </h2>
                      <button
                        onClick={() => handleOpenEditThemeModal(selectedTheme)}
                        className="text-xs text-amber-600 hover:underline font-bold"
                      >
                        Sửa
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      {selectedTheme.fullFaceDescription}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      soundEffects.playPop();
                      onPlayTheme(selectedTheme);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Xem trước & Bắt đầu chơi</span>
                  </button>

                  <button
                    onClick={handleOpenAddPartModal}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm đáp án nhận biết</span>
                  </button>
                </div>
              </div>

              {/* Answers List */}
              <div className="space-y-3">
                {(Array.isArray(selectedTheme.parts) ? selectedTheme.parts : []).map((part, idx, allParts) => (
                  <div
                    key={part.id || idx}
                    className="p-4 rounded-2xl border-2 border-slate-100 hover:border-amber-300 bg-white hover:bg-amber-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 font-black text-sm flex items-center justify-center shrink-0 shadow-inner">
                        #{idx + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-extrabold text-slate-900 truncate">
                            {part.name}
                          </h4>
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            <span>{part.regions?.length || 1} vùng soi</span>
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                          Đọc: &ldquo;{part.spokenName || part.name}&rdquo; · {part.description}
                        </p>

                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                          <span>
                            Âm thanh: {part.audioUrl ? 'Giọng cô ghi âm / Tải lên' : 'Giọng nữ tiếng Việt (TTS)'}
                          </span>
                          {part.hint && <span>· Có gợi ý câu hỏi</span>}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => handleTestPartAudio(part)}
                        title="Nghe thử âm thanh phát ra khi bấm Hiện đáp án"
                        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition-colors"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">Nghe thử</span>
                      </button>

                      <div className="flex items-center bg-slate-100 rounded-xl p-0.5">
                        <button
                          onClick={() => handleMovePart(idx, 'up')}
                          disabled={idx === 0}
                          title="Chuyển lên trước"
                          className="p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMovePart(idx, 'down')}
                          disabled={idx === allParts.length - 1}
                          title="Chuyển xuống sau"
                          className="p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleOpenEditPartModal(part)}
                        title="Chỉnh sửa đáp án và các vùng soi"
                        className="p-2 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-xl border border-slate-200 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {selectedTheme.parts.length > 1 && (
                        <button
                          onClick={() => {
                            setDeleteConfirmation({
                              type: 'part',
                              id: part.id,
                              title: part.name
                            });
                          }}
                          title="Xóa đáp án này"
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
              <p className="text-slate-500">Vui lòng chọn bài học từ danh sách.</p>
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL 1: THEME/LESSON EDITOR --- */}
      {isEditingThemeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-amber-200 w-full max-w-lg space-y-4">
            <h3 className="text-xl font-black text-slate-900">
              {themeForm.id ? 'Chỉnh Sửa Bài Học' : 'Tạo Bài Học Mới'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên bài học *
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Khám Phá Khuôn Mặt Em Bé, Nhận Biết Trái Cây..."
                  value={themeForm.title}
                  onChange={e => setThemeForm({ ...themeForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:outline-hidden text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hình ảnh chính của bài học *
                </label>
                <div className="flex items-center gap-3 p-3 bg-amber-50/50 rounded-2xl border border-amber-200">
                  <div className="w-20 h-20 rounded-xl bg-white border border-amber-200 overflow-hidden flex items-center justify-center p-1 shrink-0 shadow-inner">
                    <img src={themeForm.faceImageUrl} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setThemeForm(prev => ({ ...prev, faceImageUrl: createSvgDataUrl(svgBabyFace), icon: '👶' }))}
                        className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-amber-100 rounded-lg border border-slate-200"
                      >
                        Mẫu Em Bé
                      </button>
                      <button
                        type="button"
                        onClick={() => setThemeForm(prev => ({ ...prev, faceImageUrl: createSvgDataUrl(svgGirlFace), icon: '👧' }))}
                        className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-amber-100 rounded-lg border border-slate-200"
                      >
                        Mẫu Bé Gái
                      </button>
                    </div>

                    <input
                      type="file"
                      ref={faceUploadRef}
                      onChange={handleFacePhotoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => faceUploadRef.current?.click()}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Tải ảnh từ máy tính (PNG, JPG, WebP)</span>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lời khen khi hoàn thành hoặc bấm &ldquo;Hiện Toàn Bộ&rdquo;
                </label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Các bé giỏi quá! Đây là khuôn mặt đáng yêu của bé..."
                  value={themeForm.fullFaceDescription}
                  onChange={e => setThemeForm({ ...themeForm, fullFaceDescription: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-amber-500 focus:outline-hidden text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsEditingThemeModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveTheme}
                className="px-5 py-2.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-md"
              >
                Lưu bài học
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: PART & MULTI-REGION COORDINATE EDITOR --- */}
      {isEditingPartModal && editingPart && selectedTheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-amber-200 w-full max-w-2xl max-h-[92vh] overflow-y-auto space-y-4">
            <h3 className="text-xl font-black text-slate-900">
              Thiết Lập Đáp Án & Vùng Soi
            </h3>

            <div className="space-y-4">
              {/* Part Name & Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên đáp án (Hiển thị chữ to khi mở đáp án) *
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đôi mắt, Cái mũi, Cái miệng, Đôi tai..."
                  value={editingPart.name}
                  onChange={e => setEditingPart({
                    ...editingPart,
                    name: e.target.value,
                    spokenName: editingPart.spokenName || `${e.target.value}!`
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:outline-hidden text-sm font-bold"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-xs font-bold text-slate-400 self-center">Chọn nhanh:</span>
                  {['Đôi mắt', 'Cái mũi', 'Cái miệng', 'Đôi tai'].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        // Automatically setup pair regions if Đôi mắt or Đôi tai!
                        let defaultRegions: TargetRegion[] = [{ x: 350, y: 325, radius: 55 }];
                        if (preset === 'Đôi mắt') {
                          defaultRegions = [
                            { x: 290, y: 250, radius: 55 },
                            { x: 410, y: 250, radius: 55 }
                          ];
                        } else if (preset === 'Đôi tai') {
                          defaultRegions = [
                            { x: 180, y: 280, radius: 58 },
                            { x: 520, y: 280, radius: 58 }
                          ];
                        } else if (preset === 'Cái miệng') {
                          defaultRegions = [{ x: 350, y: 405, radius: 68 }];
                        } else if (preset === 'Cái mũi') {
                          defaultRegions = [{ x: 350, y: 325, radius: 55 }];
                        }

                        setEditingPart({
                          ...editingPart,
                          name: preset,
                          spokenName: `${preset}!`,
                          description: `${preset}!`,
                          regions: defaultRegions
                        });
                      }}
                      className="px-3 py-1 text-xs font-extrabold bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spoken Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Câu phát âm khi mở đáp án (Giọng đọc)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đôi mắt!, Cái mũi!, Cái miệng!, Đôi tai!"
                  value={editingPart.spokenName}
                  onChange={e => setEditingPart({ ...editingPart, spokenName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:outline-hidden text-sm"
                />
              </div>

              {/* MULTI-REGION CLICK-TO-PIN SURFACE */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    <span>Bấm trực tiếp vào ảnh để đặt các vùng nhận biết ({editingPart.regions.length} vùng)</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleAddSecondRegion}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-2xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Thêm vùng nhận diện (cho Đôi mắt / Đôi tai)</span>
                  </button>
                </div>

                {/* Interactive Face Canvas Area */}
                <div
                  onClick={handleFacePinClick}
                  className="relative w-full aspect-[4/3] max-w-md mx-auto rounded-2xl overflow-hidden border-2 border-amber-300 bg-white cursor-crosshair shadow-inner"
                >
                  <img
                    src={selectedTheme.faceImageUrl}
                    alt="Face Map"
                    className="w-full h-full object-contain pointer-events-none"
                  />

                  {/* Render Pin Indicator for each region */}
                  {editingPart.regions.map((reg, idx) => (
                    <div
                      key={idx}
                      style={{
                        left: `${(reg.x / 800) * 100}%`,
                        top: `${(reg.y / 600) * 100}%`,
                        width: `${(reg.radius * 2 / 800) * 100}%`,
                        height: `${(reg.radius * 2 / 600) * 100}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      className="absolute rounded-full border-4 border-amber-500 bg-amber-400/35 flex items-center justify-center pointer-events-none shadow-md animate-pulse"
                    >
                      <span className="text-[11px] font-black text-amber-950 bg-white/90 px-1.5 py-0.5 rounded-full shadow-2xs">
                        Vùng {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>👆 Chạm vào hình để đổi tọa độ</span>
                  {editingPart.regions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRegion(editingPart.regions.length - 1)}
                      className="text-rose-600 hover:underline font-bold"
                    >
                      Xóa vùng #{editingPart.regions.length}
                    </button>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả chi tiết bổ sung (tùy chọn)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Đôi mắt sáng long lanh giúp bé nhìn thấy mọi vật..."
                  value={editingPart.description}
                  onChange={e => setEditingPart({ ...editingPart, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-amber-500 focus:outline-hidden text-sm"
                />
              </div>

              {/* Hint */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Gợi ý câu hỏi cho cô khi đố trẻ (tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Dùng để chớp chớp, mở to nhìn thấy cô và bạn..."
                  value={editingPart.hint || ''}
                  onChange={e => setEditingPart({ ...editingPart, hint: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-amber-500 focus:outline-hidden text-sm"
                />
              </div>

              {/* Audio Controls */}
              <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-amber-600" />
                    <span>Âm Thanh Lời Thoại Cho Đáp Án Này</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTestPartAudio(editingPart)}
                    className="text-xs text-amber-700 font-bold hover:underline"
                  >
                    Nghe thử
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsVoiceRecorderOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition-colors"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Ghi âm trực tiếp bằng micro của cô</span>
                  </button>

                  <label className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải file MP3 / WAV</span>
                    <input
                      type="file"
                      onChange={handleAudioFileUpload}
                      accept="audio/*"
                      className="hidden"
                    />
                  </label>
                </div>

                {editingPart.audioUrl && (
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between">
                    <span className="font-semibold">✓ Đã gắn file âm thanh riêng của cô</span>
                    <button
                      type="button"
                      onClick={() => setEditingPart({ ...editingPart, audioUrl: undefined })}
                      className="text-rose-600 hover:underline font-bold text-[11px]"
                    >
                      Gỡ bỏ
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setIsEditingPartModal(false);
                  setEditingPart(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={handleSavePart}
                className="px-5 py-2.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-md"
              >
                Lưu đáp án
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: DELETE CONFIRMATION --- */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-rose-200 w-full max-w-sm text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-slate-900">
              Xác Nhận Xóa
            </h3>

            <p className="text-xs text-slate-600">
              Cô có chắc chắn muốn xóa {deleteConfirmation.type === 'theme' ? 'bài học' : 'đáp án'}: <strong className="text-slate-900">&ldquo;{deleteConfirmation.title}&rdquo;</strong>?
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Giữ lại
              </button>
              <button
                onClick={() => {
                  if (deleteConfirmation.type === 'theme') {
                    handleDeleteThemeConfirm(deleteConfirmation.id);
                  } else {
                    handleDeletePartConfirm(deleteConfirmation.id);
                  }
                }}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 4: VOICE RECORDER --- */}
      {editingPart && (
        <VoiceRecorderModal
          isOpen={isVoiceRecorderOpen}
          onClose={() => setIsVoiceRecorderOpen(false)}
          cardTitle={editingPart.name || 'Đáp án'}
          onSaveAudio={(audioDataUrl) => {
            setEditingPart({
              ...editingPart,
              audioUrl: audioDataUrl,
              audioMode: 'upload_first'
            });
            showToast('Đã lưu bản ghi âm giọng cô vào đáp án!');
          }}
        />
      )}
    </div>
  );
};
