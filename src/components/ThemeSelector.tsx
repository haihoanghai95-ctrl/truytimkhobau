import React from 'react';
import { FaceTheme, DifficultyLevel, MaskStyle } from '../types';
import { Play, Plus, Sparkles, Sliders, ShieldCheck } from 'lucide-react';
import { soundEffects } from '../services/soundEffects';

interface ThemeSelectorProps {
  themes: FaceTheme[];
  onSelectTheme: (theme: FaceTheme) => void;
  onOpenTeacherAdmin: () => void;
  difficulty: DifficultyLevel;
  onChangeDifficulty: (diff: DifficultyLevel) => void;
  maskStyle: MaskStyle;
  onChangeMaskStyle: (style: MaskStyle) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  themes,
  onSelectTheme,
  onOpenTeacherAdmin,
  difficulty,
  onChangeDifficulty,
  maskStyle,
  onChangeMaskStyle
}) => {
  const difficultyOptions: { id: DifficultyLevel; label: string; desc: string; age: string }[] = [
    {
      id: 'easy',
      label: 'Dễ (Kính to)',
      desc: 'Vùng quan sát rộng, tối ưu nhất cho trẻ nhà trẻ',
      age: 'Bé 12 - 36 tháng'
    },
    {
      id: 'medium',
      label: 'Vừa (Kính chuẩn)',
      desc: 'Vùng quan sát vừa phải, kích thích tư duy',
      age: 'Bé 3 - 4 tuổi'
    },
    {
      id: 'hard',
      label: 'Thử thách (Kính nhỏ)',
      desc: 'Vùng soi hẹp, rèn luyện sự chú ý chi tiết',
      age: 'Bé 4 - 6 tuổi'
    }
  ];

  const maskOptions: { id: MaskStyle; label: string; icon: string }[] = [
    { id: 'golden_sand', label: 'Vàng Kem Đặc (Che Kín 100%)', icon: '✨' },
    { id: 'mystery_cloud', label: 'Mây Thần Kỳ', icon: '☁️' }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-7 animate-fade-in">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 p-6 sm:p-10 shadow-xl border-4 border-white">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 backdrop-blur-sm text-amber-900 text-xs font-black shadow-sm mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Trò Chơi Nhận Biết Dành Cho Trẻ Mầm Non (12–36 Tháng)</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-amber-950 tracking-tight leading-tight">
            Truy Tìm Kho Báu – Khám Phá Khuôn Mặt
          </h1>

          <p className="mt-2 text-sm sm:text-base text-amber-900/95 font-semibold leading-relaxed">
            Dùng chiếc kính lúp soi từng bộ phận trên khuôn mặt em bé: <strong>Đôi mắt</strong>, <strong>Cái mũi</strong>, <strong>Cái miệng</strong>, <strong>Đôi tai</strong>. Giúp trẻ quan sát, nhận diện đồ vật quen thuộc và phát triển ngôn ngữ qua âm thanh tiếng Việt.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {themes.length > 0 && (
              <button
                onClick={() => {
                  soundEffects.playPop();
                  onSelectTheme(themes[0]);
                }}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-amber-950 hover:bg-black text-white font-extrabold shadow-lg hover:shadow-xl hover:scale-102 active:scale-95 transition-all text-sm sm:text-base"
              >
                <Play className="w-5 h-5 fill-current text-amber-400" />
                <span>Bắt Đầu Khám Phá Ngay</span>
              </button>
            )}

            <button
              onClick={() => {
                soundEffects.playPop();
                onOpenTeacherAdmin();
              }}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white hover:bg-amber-50 text-amber-900 font-extrabold shadow-md border-2 border-amber-300 hover:scale-102 active:scale-95 transition-all text-sm"
            >
              <Plus className="w-4 h-4 text-amber-600" />
              <span>Kho Chủ Đề Của Giáo Viên</span>
            </button>
          </div>
        </div>
      </div>

      {/* Classroom Settings Deck */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-amber-200/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Difficulty selector */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-amber-500" />
              <span>Độ Lớn Kính Lúp (Độ Khó)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {difficultyOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => {
                    soundEffects.playPop();
                    onChangeDifficulty(opt.id);
                  }}
                  className={`p-3 rounded-2xl text-left border-2 transition-all ${
                    difficulty === opt.id
                      ? 'border-amber-500 bg-amber-50 text-amber-950 shadow-sm'
                      : 'border-slate-100 hover:border-slate-200 bg-slate-50/50 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs sm:text-sm">{opt.label}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-200/60 text-amber-900">
                      {opt.age}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Mask Style */}
          <div className="lg:w-64 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Lớp Phủ Bí Ẩn</span>
            </div>
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
              {maskOptions.map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    soundEffects.playPop();
                    onChangeMaskStyle(m.id);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                    maskStyle === m.id
                      ? 'bg-white text-amber-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className="text-sm">{m.icon}</span>
                  <span className="truncate text-[11px] sm:text-xs">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Themes Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Chọn Bài Học Khuôn Mặt ({themes.length})
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Cô giáo chọn một bài học để bắt đầu tổ chức hoạt động nhận biết cùng trẻ
            </p>
          </div>

          <button
            onClick={onOpenTeacherAdmin}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3.5 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm bài học</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {themes.map(theme => (
            <div
              key={theme.id}
              className="group bg-white rounded-3xl p-5 border-2 border-slate-100 hover:border-amber-400 hover:shadow-xl transition-all flex flex-col sm:flex-row gap-5 items-center justify-between"
            >
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl bg-amber-50/60 border-2 border-amber-200 overflow-hidden flex items-center justify-center p-1.5 shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                <img
                  src={theme.faceImageUrl}
                  alt={theme.title}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-2xl">{theme.icon}</span>
                    <h3 className="text-lg font-black text-slate-900 group-hover:text-amber-700 transition-colors truncate">
                      {theme.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {theme.description || 'Bài học nhận biết các bộ phận trên khuôn mặt.'}
                  </p>

                  {/* List of 4 parts badge */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {(Array.isArray(theme.parts) ? theme.parts : []).map((p, pIdx) => (
                      <span
                        key={p?.id || pIdx}
                        className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-200/60"
                      >
                        {p?.name || 'Bộ phận'}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      soundEffects.playPop();
                      onSelectTheme(theme);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-sm shadow-md active:scale-95 transition-all"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Vào Chơi Ngay</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Classroom Pedagogy Banner */}
      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/80 flex items-center gap-3 text-xs text-emerald-800">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
        <p>
          <strong className="font-bold">Phương pháp giáo dục mầm non (12–36 tháng):</strong> Trẻ không bắt buộc phải nói, trẻ có thể quan sát, chỉ tay và đoán bằng cử chỉ. Giáo viên rê kính lúp để trẻ quan sát kỹ, sau đó bấm &ldquo;Hiện đáp án&rdquo; để củng cố nhận biết bằng âm thanh tiếng Việt và hình ảnh phát sáng nổi bật!
        </p>
      </div>
    </div>
  );
};
