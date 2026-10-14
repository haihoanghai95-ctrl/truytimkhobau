import React from 'react';
import { X, CheckCircle, BookOpen } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    {
      step: '1',
      title: 'Kéo Kính Lúp Khám Phá Bí Ẩn',
      desc: 'Toàn bộ khuôn mặt được che kín 100% bởi lớp phủ vàng kem đặc (không làm mờ, không lộ gợi ý). Kính lúp phóng đại 1.3–1.5 lần, soi đến đâu hiện rõ sắc nét đến đó!'
    },
    {
      step: '2',
      title: 'Cô Đặt Câu Hỏi Gợi Mở',
      desc: 'Cô hỏi: "Các con nhìn xem, đây là gì nào?" Trẻ có thể chỉ tay, cử chỉ hoặc nói theo khả năng của trẻ nhà trẻ (12–36 tháng).'
    },
    {
      step: '3',
      title: 'Bấm "Hiện Đáp Án"',
      desc: 'Hệ thống tự động phát hiện vùng đang soi, làm nổi bật bộ phận tương ứng (cả hai mắt hoặc cả hai tai cùng sáng lên), hiển thị chữ lớn và phát giọng đọc tiếng Việt rõ ràng.'
    },
    {
      step: '4',
      title: 'Khám Phá Trọn Vẹn Khuôn Mặt',
      desc: 'Sau khi khám phá đủ 4 bộ phận, toàn bộ khuôn mặt em bé sẽ xuất hiện với hiệu ứng pháo hoa vui tươi và lời khen ngợi dành cho các bé!'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-amber-200 w-full max-w-lg space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Hướng Dẫn Trò Chơi Mầm Non
              </h3>
              <p className="text-xs text-slate-500">
                Tổ chức hoạt động nhận biết với trẻ từ 12–36 tháng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {steps.map(s => (
            <div key={s.step} className="flex items-start gap-3.5 p-3 rounded-2xl bg-amber-50/50 border border-amber-100">
              <div className="w-8 h-8 rounded-full bg-amber-400 text-amber-950 font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                {s.step}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">{s.title}</h4>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Lưu ý:</strong> Luôn đọc tên <strong>&ldquo;Đôi mắt&rdquo;</strong> và <strong>&ldquo;Đôi tai&rdquo;</strong> theo cặp, không phân biệt trái/phải để phù hợp với lứa tuổi nhà trẻ.
          </span>
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-sm rounded-2xl shadow-md transition-all active:scale-95"
          >
            Bé Sẵn Sàng Khám Phá!
          </button>
        </div>
      </div>
    </div>
  );
};
