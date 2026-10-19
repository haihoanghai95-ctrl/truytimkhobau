import { FaceTheme, FacePart } from '../types';
import { BUILTIN_VIETNAMESE_AUDIO } from './builtInAudios';

export function createSvgDataUrl(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

// 1. Cute Toddler Boy Face (Khuôn mặt em bé hoạt hình)
// Centered in an 800x600 canvas coordinate system
export const svgBabyFace = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <!-- Radial gradient for soft cheek blush -->
    <radialGradient id="blushGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FB7185" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#FB7185" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Warm pastel background -->
  <rect width="800" height="600" fill="#FEF3C7" rx="30"/>
  <circle cx="350" cy="300" r="280" fill="#FFFBEB"/>

  <!-- Left Ear (Tai trái - x: 180, y: 280) -->
  <g id="ear-left">
    <ellipse cx="180" cy="280" rx="38" ry="52" fill="#FDE047" stroke="#D97706" stroke-width="7"/>
    <ellipse cx="180" cy="280" rx="20" ry="32" fill="#FCD34D"/>
    <path d="M 180 265 Q 170 280 185 295" stroke="#B45309" stroke-width="4" stroke-linecap="round" fill="none"/>
  </g>

  <!-- Right Ear (Tai phải - x: 520, y: 280) -->
  <g id="ear-right">
    <ellipse cx="520" cy="280" rx="38" ry="52" fill="#FDE047" stroke="#D97706" stroke-width="7"/>
    <ellipse cx="520" cy="280" rx="20" ry="32" fill="#FCD34D"/>
    <path d="M 520 265 Q 530 280 515 295" stroke="#B45309" stroke-width="4" stroke-linecap="round" fill="none"/>
  </g>

  <!-- Face Head Oval (Center x: 350, y: 305) -->
  <ellipse cx="350" cy="305" rx="180" ry="195" fill="#FEF08A" stroke="#D97706" stroke-width="8"/>

  <!-- Baby Hair -->
  <g id="hair">
    <path d="M 190 230 C 180 140, 260 80, 350 80 C 440 80, 520 140, 510 230 C 480 180, 430 165, 390 175 C 360 180, 340 160, 310 170 C 270 185, 230 180, 190 230 Z" fill="#78350F" stroke="#451A03" stroke-width="6"/>
    <!-- Tufts of hair -->
    <path d="M 330 85 Q 350 50 370 85" fill="#78350F" stroke="#451A03" stroke-width="5"/>
    <path d="M 360 85 Q 390 60 395 90" fill="#78350F" stroke="#451A03" stroke-width="5"/>
  </g>

  <!-- Eyebrows -->
  <g id="eyebrows">
    <path d="M 250 205 Q 290 185 330 200" stroke="#78350F" stroke-width="8" stroke-linecap="round" fill="none"/>
    <path d="M 370 200 Q 410 185 450 205" stroke="#78350F" stroke-width="8" stroke-linecap="round" fill="none"/>
  </g>

  <!-- Left Eye (x: 290, y: 250) -->
  <g id="eye-left">
    <ellipse cx="290" cy="250" rx="36" ry="38" fill="#FFFFFF" stroke="#334155" stroke-width="5"/>
    <circle cx="290" cy="250" r="22" fill="#0284C7"/>
    <circle cx="290" cy="250" r="14" fill="#0F172A"/>
    <circle cx="282" cy="240" r="7" fill="#FFFFFF"/>
    <circle cx="298" cy="258" r="3.5" fill="#FFFFFF"/>
  </g>

  <!-- Right Eye (x: 410, y: 250) -->
  <g id="eye-right">
    <ellipse cx="410" cy="250" rx="36" ry="38" fill="#FFFFFF" stroke="#334155" stroke-width="5"/>
    <circle cx="410" cy="250" r="22" fill="#0284C7"/>
    <circle cx="410" cy="250" r="14" fill="#0F172A"/>
    <circle cx="402" cy="240" r="7" fill="#FFFFFF"/>
    <circle cx="418" cy="258" r="3.5" fill="#FFFFFF"/>
  </g>

  <!-- Rosy Cheeks -->
  <ellipse cx="235" cy="335" rx="32" ry="20" fill="url(#blushGrad)"/>
  <ellipse cx="465" cy="335" rx="32" ry="20" fill="url(#blushGrad)"/>

  <!-- Nose (Cái mũi - x: 350, y: 325) -->
  <g id="nose">
    <ellipse cx="350" cy="325" rx="14" ry="10" fill="#F59E0B" stroke="#D97706" stroke-width="4"/>
    <path d="M 342 320 Q 350 310 358 320" stroke="#B45309" stroke-width="3" stroke-linecap="round" fill="none"/>
  </g>

  <!-- Mouth (Cái miệng - x: 350, y: 405) -->
  <g id="mouth">
    <path d="M 275 380 Q 350 460 425 380 Z" fill="#E11D48" stroke="#9F1239" stroke-width="6" stroke-linejoin="round"/>
    <path d="M 320 384 Q 350 405 380 384 Z" fill="#FFFFFF"/>
    <path d="M 315 425 Q 350 400 385 425 Q 350 455 315 425 Z" fill="#FDA4AF"/>
    <circle cx="270" cy="380" r="4" fill="#BE123C"/>
    <circle cx="430" cy="380" r="4" fill="#BE123C"/>
  </g>

  <!-- Chin -->
  <path d="M 335 465 Q 350 472 365 465" stroke="#D97706" stroke-width="4" stroke-linecap="round" fill="none"/>
</svg>`;

// 2. Cute Baby Girl Face with Ribbon Pigtails
export const svgGirlFace = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <rect width="800" height="600" fill="#FDF2F8" rx="30"/>
  <circle cx="350" cy="300" r="280" fill="#FFF1F2"/>

  <!-- Left Pigtail & Red Bow -->
  <g id="pigtail-left">
    <ellipse cx="140" cy="180" rx="35" ry="50" transform="rotate(-30 140 180)" fill="#78350F" stroke="#451A03" stroke-width="5"/>
    <circle cx="165" cy="180" r="10" fill="#EF4444"/>
    <polygon points="145,170 165,180 145,190" fill="#DC2626"/>
    <polygon points="185,170 165,180 185,190" fill="#DC2626"/>
  </g>

  <!-- Right Pigtail & Red Bow -->
  <g id="pigtail-right">
    <ellipse cx="560" cy="180" rx="35" ry="50" transform="rotate(30 560 180)" fill="#78350F" stroke="#451A03" stroke-width="5"/>
    <circle cx="535" cy="180" r="10" fill="#EF4444"/>
    <polygon points="555,170 535,180 555,190" fill="#DC2626"/>
    <polygon points="515,170 535,180 515,190" fill="#DC2626"/>
  </g>

  <!-- Left Ear (x: 180, y: 285) -->
  <g id="ear-left">
    <ellipse cx="180" cy="285" rx="36" ry="48" fill="#FDE047" stroke="#D97706" stroke-width="6"/>
    <ellipse cx="180" cy="285" rx="18" ry="28" fill="#FCD34D"/>
    <circle cx="180" cy="315" r="7" fill="#F43F5E"/>
  </g>

  <!-- Right Ear (x: 520, y: 285) -->
  <g id="ear-right">
    <ellipse cx="520" cy="285" rx="36" ry="48" fill="#FDE047" stroke="#D97706" stroke-width="6"/>
    <ellipse cx="520" cy="285" rx="18" ry="28" fill="#FCD34D"/>
    <circle cx="520" cy="315" r="7" fill="#F43F5E"/>
  </g>

  <!-- Face Head -->
  <ellipse cx="350" cy="305" rx="180" ry="195" fill="#FEF08A" stroke="#D97706" stroke-width="8"/>

  <!-- Girl Hair & Bangs -->
  <g id="girl-hair">
    <path d="M 185 220 C 180 140, 260 85, 350 85 C 440 85, 520 140, 515 220 C 470 170, 420 160, 350 160 C 280 160, 230 170, 185 220 Z" fill="#78350F" stroke="#451A03" stroke-width="6"/>
    <path d="M 230 175 Q 260 210 290 175" stroke="#451A03" stroke-width="4" fill="none"/>
    <path d="M 290 175 Q 320 210 350 175" stroke="#451A03" stroke-width="4" fill="none"/>
    <path d="M 350 175 Q 380 210 410 175" stroke="#451A03" stroke-width="4" fill="none"/>
    <path d="M 410 175 Q 440 210 470 175" stroke="#451A03" stroke-width="4" fill="none"/>
  </g>

  <!-- Eyebrows -->
  <path d="M 255 210 Q 290 195 325 210" stroke="#78350F" stroke-width="6" stroke-linecap="round" fill="none"/>
  <path d="M 375 210 Q 410 195 445 210" stroke="#78350F" stroke-width="6" stroke-linecap="round" fill="none"/>

  <!-- Left Eye with eyelashes (x: 290, y: 255) -->
  <g id="eye-left">
    <line x1="265" y1="230" x2="255" y2="218" stroke="#1E293B" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="290" y1="222" x2="290" y2="210" stroke="#1E293B" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="315" y1="230" x2="325" y2="218" stroke="#1E293B" stroke-width="3.5" stroke-linecap="round"/>

    <ellipse cx="290" cy="255" rx="34" ry="36" fill="#FFFFFF" stroke="#334155" stroke-width="5"/>
    <circle cx="290" cy="255" r="22" fill="#0D9488"/>
    <circle cx="290" cy="255" r="14" fill="#042F2E"/>
    <circle cx="282" cy="245" r="7" fill="#FFFFFF"/>
    <circle cx="298" cy="262" r="3.5" fill="#FFFFFF"/>
  </g>

  <!-- Right Eye with eyelashes (x: 410, y: 255) -->
  <g id="eye-right">
    <line x1="385" y1="230" x2="375" y2="218" stroke="#1E293B" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="410" y1="222" x2="410" y2="210" stroke="#1E293B" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="435" y1="230" x2="445" y2="218" stroke="#1E293B" stroke-width="3.5" stroke-linecap="round"/>

    <ellipse cx="410" cy="255" rx="34" ry="36" fill="#FFFFFF" stroke="#334155" stroke-width="5"/>
    <circle cx="410" cy="255" r="22" fill="#0D9488"/>
    <circle cx="410" cy="255" r="14" fill="#042F2E"/>
    <circle cx="402" cy="245" r="7" fill="#FFFFFF"/>
    <circle cx="418" cy="262" r="3.5" fill="#FFFFFF"/>
  </g>

  <!-- Cheeks -->
  <ellipse cx="235" cy="335" rx="30" ry="18" fill="#FB7185" opacity="0.6"/>
  <ellipse cx="465" cy="335" rx="30" ry="18" fill="#FB7185" opacity="0.6"/>

  <!-- Button Nose (x: 350, y: 325) -->
  <g id="nose">
    <ellipse cx="350" cy="325" rx="12" ry="9" fill="#F59E0B" stroke="#D97706" stroke-width="4"/>
  </g>

  <!-- Mouth (x: 350, y: 410) -->
  <g id="mouth">
    <path d="M 285 390 Q 350 455 415 390 Z" fill="#F43F5E" stroke="#BE123C" stroke-width="5"/>
    <path d="M 320 425 Q 350 405 380 425 Q 350 450 320 425 Z" fill="#FDA4AF"/>
  </g>
</svg>`;

// Standard 4 facial features for preschool toddlers (12 - 36 months)
export const STANDARD_FACE_PARTS: FacePart[] = [
  {
    id: 'eyes',
    name: 'Đôi mắt',
    spokenName: 'Đôi mắt',
    description: 'Đôi mắt! Đôi mắt tròn xoe, sáng long lanh giúp bé nhìn thấy cô giáo, cha mẹ và đồ chơi đáng yêu.',
    audioMode: 'upload_first',
    audioUrl: BUILTIN_VIETNAMESE_AUDIO['eyes'],
    hint: 'Dùng để chớp chớp, mở to nhìn thấy mọi vật xung quanh bé.',
    regions: [
      { x: 290, y: 250, radius: 55 }, // Eye 1 (left)
      { x: 410, y: 250, radius: 55 }  // Eye 2 (right)
    ]
  },
  {
    id: 'nose',
    name: 'Cái mũi',
    spokenName: 'Cái mũi',
    description: 'Cái mũi! Chiếc mũi xinh xắn ở chính giữa khuôn mặt, giúp bé hít thở và ngửi mùi hương thơm.',
    audioMode: 'upload_first',
    audioUrl: BUILTIN_VIETNAMESE_AUDIO['nose'],
    hint: 'Bộ phận nhỏ xinh ở ngay giữa khuôn mặt, dùng để hít thở và ngửi mùi thơm.',
    regions: [
      { x: 350, y: 325, radius: 55 }
    ]
  },
  {
    id: 'mouth',
    name: 'Cái miệng',
    spokenName: 'Cái miệng',
    description: 'Cái miệng! Miệng xinh nở nụ cười thật tươi, biết hát những bài ca vui vẻ và ăn cơm thật ngoan.',
    audioMode: 'upload_first',
    audioUrl: BUILTIN_VIETNAMESE_AUDIO['mouth'],
    hint: 'Bộ phận nở nụ cười thật tươi, biết nói lời chào cô và ăn cơm ngoan.',
    regions: [
      { x: 350, y: 405, radius: 68 }
    ]
  },
  {
    id: 'ears',
    name: 'Đôi tai',
    spokenName: 'Đôi tai',
    description: 'Đôi tai! Bé có đôi tai xinh ở hai bên khuôn mặt để lắng nghe tiếng chim hót và lời cô dạy bảo.',
    audioMode: 'upload_first',
    audioUrl: BUILTIN_VIETNAMESE_AUDIO['ears'],
    hint: 'Bộ phận ở hai bên cạnh khuôn mặt, dùng để lắng nghe âm thanh.',
    regions: [
      { x: 180, y: 280, radius: 58 }, // Ear 1 (left)
      { x: 520, y: 280, radius: 58 }  // Ear 2 (right)
    ]
  }
];

export const INITIAL_FACE_THEMES: FaceTheme[] = [
  {
    id: 'theme-face-baby',
    title: 'Khám Phá Khuôn Mặt Em Bé',
    category: 'Nhận biết các bộ phận khuôn mặt (12–36 tháng)',
    icon: '👶',
    description: 'Bài học trọng tâm: Đôi mắt, Cái mũi, Cái miệng, Đôi tai.',
    faceImageUrl: createSvgDataUrl(svgBabyFace),
    fullFaceDescription: 'Các bé giỏi quá! Đây là khuôn mặt đáng yêu của bé. Trên khuôn mặt có đôi mắt, cái mũi, cái miệng và đôi tai xinh xắn!',
    createdAt: Date.now() - 500000,
    updatedAt: Date.now() - 500000,
    isCustom: false,
    parts: STANDARD_FACE_PARTS
  },
  {
    id: 'theme-face-girl',
    title: 'Khuôn Mặt Bé Gái Đáng Yêu',
    category: 'Nhận biết các bộ phận khuôn mặt (12–36 tháng)',
    icon: '👧',
    description: 'Bạn gái thắt nơ đỏ: Bé làm quen với Đôi mắt, Cái mũi, Cái miệng, Đôi tai.',
    faceImageUrl: createSvgDataUrl(svgGirlFace),
    fullFaceDescription: 'Các bé thật tuyệt vời! Khuôn mặt bạn gái thật xinh xắn với đôi mắt sáng, chiếc mũi nhỏ, miệng cười tươi và đôi tai ngoan!',
    createdAt: Date.now() - 400000,
    updatedAt: Date.now() - 400000,
    isCustom: false,
    parts: [
      {
        id: 'eyes',
        name: 'Đôi mắt',
        spokenName: 'Đôi mắt',
        description: 'Đôi mắt! Đôi mắt bạn gái sáng lấp lánh với hàng mi cong xinh xắn.',
        audioMode: 'tts_only',
        hint: 'Hai mắt xinh có hàng mi cong, dùng để nhìn ngắm.',
        regions: [
          { x: 290, y: 255, radius: 55 },
          { x: 410, y: 255, radius: 55 }
        ]
      },
      {
        id: 'nose',
        name: 'Cái mũi',
        spokenName: 'Cái mũi',
        description: 'Cái mũi! Mũi nhỏ nhắn giúp bạn gái ngửi hương hoa thơm ngát.',
        audioMode: 'tts_only',
        hint: 'Chiếc mũi nhỏ xíu ở giữa khuôn mặt.',
        regions: [
          { x: 350, y: 325, radius: 55 }
        ]
      },
      {
        id: 'mouth',
        name: 'Cái miệng',
        spokenName: 'Cái miệng',
        description: 'Cái miệng! Miệng chúm chím nở nụ cười rạng rỡ chào cô và bạn.',
        audioMode: 'tts_only',
        hint: 'Nụ cười tươi rạng rỡ màu hoa đào.',
        regions: [
          { x: 350, y: 410, radius: 68 }
        ]
      },
      {
        id: 'ears',
        name: 'Đôi tai',
        spokenName: 'Đôi tai',
        description: 'Đôi tai! Đôi tai có khuyên hoa nhỏ xíu, luôn lắng nghe lời cô giáo.',
        audioMode: 'tts_only',
        hint: 'Đôi tai ở hai bên khuôn mặt có đeo hoa tai xinh.',
        regions: [
          { x: 180, y: 285, radius: 58 },
          { x: 520, y: 285, radius: 58 }
        ]
      }
    ]
  }
];
