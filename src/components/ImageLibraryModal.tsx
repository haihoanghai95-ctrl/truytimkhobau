import React, { useRef } from 'react';
import { svgBabyFace, svgGirlFace, createSvgDataUrl } from '../services/sampleData';
import { Upload, X, Smile, Sparkles } from 'lucide-react';

interface ImageLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFace: (faceDataUrl: string, title?: string) => void;
}

export const ImageLibraryModal: React.FC<ImageLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectFace
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const presets = [
    {
      name: 'Khuôn Mặt Bé Trai Kháu Khỉnh',
      icon: '👦',
      svg: svgBabyFace,
      desc: 'Tóc ngắn màu nâu, đôi mắt xanh sáng và nụ cười rạng rỡ'
    },
    {
      name: 'Khuôn Mặt Bé Gái Đáng Yêu',
      icon: '👧',
      svg: svgGirlFace,
      desc: 'Bím tóc nơ đỏ, hàng mi cong và đôi hoa tai xinh'
    }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          onSelectFace(canvas.toDataURL('image/webp', 0.88), file.name.replace(/\.[^/.]+$/, ''));
        } else {
          onSelectFace(originalDataUrl, file.name.replace(/\.[^/.]+$/, ''));
        }
        onClose();
      };
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl border-2 border-amber-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Smile className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Chọn Khuôn Mặt</h3>
              <p className="text-xs text-slate-500">Dùng ảnh vẽ sẵn hoặc tải ảnh chụp của học sinh trong lớp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Button */}
        <div className="my-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2.5 p-4 border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-2xl bg-amber-50/50 hover:bg-amber-50 text-amber-900 font-bold transition-all"
          >
            <Upload className="w-5 h-5 text-amber-600" />
            <span>Tải ảnh chụp khuôn mặt từ thiết bị của cô (PNG, JPG)</span>
          </button>
        </div>

        {/* Presets Grid */}
        <div className="grid grid-cols-2 gap-4">
          {presets.map((preset, idx) => {
            const dataUrl = createSvgDataUrl(preset.svg);
            return (
              <button
                key={idx}
                onClick={() => {
                  onSelectFace(dataUrl, preset.name);
                  onClose();
                }}
                className="flex flex-col items-center p-4 rounded-2xl border-2 border-slate-200 hover:border-amber-400 hover:bg-amber-50/30 transition-all text-center group"
              >
                <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 overflow-hidden p-1 shadow-inner group-hover:scale-105 transition-transform">
                  <img src={dataUrl} alt={preset.name} className="w-full h-full object-contain" />
                </div>
                <span className="mt-2 text-sm font-bold text-slate-800">{preset.name}</span>
                <span className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{preset.desc}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1 text-amber-700 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ảnh vẽ vector sắc nét trên mọi bảng tương tác</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
