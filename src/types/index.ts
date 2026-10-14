export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type MaskStyle = 'soft_mist' | 'mystery_cloud' | 'golden_sand';

export interface TargetRegion {
  x: number;       // Virtual canvas X coordinate (0 - 800)
  y: number;       // Virtual canvas Y coordinate (0 - 600)
  radius: number;  // Radius in virtual canvas units (e.g. 50 - 80)
}

export interface FacePart {
  id: string;
  name: string;                  // e.g. "Đôi mắt", "Cái mũi", "Cái miệng", "Đôi tai"
  spokenName: string;            // e.g. "Đôi mắt!", "Cái mũi!", "Cái miệng!", "Đôi tai!"
  description: string;           // e.g. "Đôi mắt! Đôi mắt sáng long lanh giúp bé nhìn thấy mọi vật."
  audioUrl?: string;             // Optional custom audio file or voice recording data URL
  audioMode: 'upload_first' | 'tts_only';
  hint?: string;                 // Teacher prompt cue for toddlers e.g. "Dùng để chớp chớp, nhìn thấy cô và bạn"
  regions: TargetRegion[];       // Supports multiple detection & spotlight regions (e.g. 2 eyes for Đôi mắt, 2 ears for Đôi tai)
  // Backward compatibility fields
  targetX?: number;
  targetY?: number;
  radius?: number;
}

export interface FaceTheme {
  id: string;
  title: string;                 // e.g. "Khám Phá Khuôn Mặt Em Bé"
  category: string;              // e.g. "Nhận biết các bộ phận khuôn mặt"
  icon: string;                  // e.g. "👶", "👦", "👧"
  description?: string;
  faceImageUrl: string;          // SVG Data URL or uploaded image data URL
  fullFaceDescription: string;   // Speech when all 4 parts are completed or clicking "Hiện toàn bộ"
  fullFaceAudioUrl?: string;
  parts: FacePart[];
  createdAt: number;
  updatedAt: number;
  isCustom?: boolean;
}

export interface AppSettings {
  difficulty: DifficultyLevel;
  maskStyle: MaskStyle;
  bgmEnabled: boolean;
  sfxEnabled: boolean;
  ttsRate: number;               // 0.8 to 1.1 (slow and clear for toddlers)
  magnification: number;         // 1.1 to 1.3
}
