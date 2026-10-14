import { FaceTheme, FacePart, TargetRegion, AppSettings } from '../types';
import { INITIAL_FACE_THEMES, STANDARD_FACE_PARTS } from './sampleData';
import { saveThemeToFirestore, deleteThemeFromFirestore, fetchThemesFromFirestore, auth } from './firebase';

const DB_NAME = 'FaceDiscoveryPreschoolDB';
const DB_VERSION = 1;
const STORE_FACE_THEMES = 'face_themes';
const STORE_SETTINGS = 'settings';

export function normalizeTheme(theme: FaceTheme): FaceTheme {
  const rawParts = Array.isArray(theme.parts) ? theme.parts : [];

  // 1. Separate eye parts, ear parts, nose parts, mouth parts, and other custom parts
  const eyeParts: FacePart[] = [];
  const earParts: FacePart[] = [];
  let nosePart: FacePart | null = null;
  let mouthPart: FacePart | null = null;
  const otherParts: FacePart[] = [];

  for (const part of rawParts) {
    if (!part) continue;
    const nameLower = (part.name || (part as any).title || '').toLowerCase();
    const idLower = (part.id || '').toLowerCase();

    if (
      nameLower.includes('mắt') ||
      nameLower.includes('mat') ||
      idLower.includes('eye') ||
      idLower.includes('mat')
    ) {
      eyeParts.push(part);
    } else if (
      nameLower.includes('tai') ||
      idLower.includes('ear')
    ) {
      earParts.push(part);
    } else if (
      nameLower.includes('mũi') ||
      nameLower.includes('mui') ||
      idLower.includes('nose') ||
      idLower.includes('mui')
    ) {
      if (!nosePart) nosePart = part;
    } else if (
      nameLower.includes('miệng') ||
      nameLower.includes('mieng') ||
      idLower.includes('mouth') ||
      idLower.includes('mieng')
    ) {
      if (!mouthPart) mouthPart = part;
    } else {
      otherParts.push(part);
    }
  }

  // 2. Consolidate EYES into a SINGLE 'eyes' part with 2 regions
  const eyeRegions: TargetRegion[] = [];
  let eyeAudioUrl: string | undefined = undefined;
  let eyeAudioMode: 'upload_first' | 'tts_only' = 'tts_only';

  for (const ep of eyeParts) {
    if (ep.audioUrl) {
      eyeAudioUrl = ep.audioUrl;
      eyeAudioMode = ep.audioMode;
    }
    if (Array.isArray(ep.regions)) {
      for (const r of ep.regions) {
        if (r && typeof r.x === 'number' && typeof r.y === 'number') {
          eyeRegions.push(r);
        }
      }
    }
    if (typeof ep.targetX === 'number' && typeof ep.targetY === 'number') {
      eyeRegions.push({ x: ep.targetX, y: ep.targetY, radius: ep.radius || 55 });
    }
  }

  let finalEyeRegions = eyeRegions;
  if (finalEyeRegions.length < 2) {
    finalEyeRegions = [
      { x: 290, y: 250, radius: 55 },
      { x: 410, y: 250, radius: 55 }
    ];
  } else if (finalEyeRegions.length > 2) {
    finalEyeRegions = finalEyeRegions.slice(0, 2);
  }

  const consolidatedEyes: FacePart = {
    id: 'eyes',
    name: 'Đôi mắt',
    spokenName: 'Đôi mắt',
    description: 'Đôi mắt! Đôi mắt tròn xoe, sáng long lanh giúp bé nhìn thấy cô giáo, cha mẹ và đồ chơi đáng yêu.',
    audioMode: eyeAudioMode,
    audioUrl: eyeAudioUrl,
    hint: 'Dùng để chớp chớp, mở to nhìn thấy mọi vật xung quanh bé.',
    regions: finalEyeRegions
  };

  // 3. Consolidate EARS into a SINGLE 'ears' part with 2 regions
  const earRegions: TargetRegion[] = [];
  let earAudioUrl: string | undefined = undefined;
  let earAudioMode: 'upload_first' | 'tts_only' = 'tts_only';

  for (const er of earParts) {
    if (er.audioUrl) {
      earAudioUrl = er.audioUrl;
      earAudioMode = er.audioMode;
    }
    if (Array.isArray(er.regions)) {
      for (const r of er.regions) {
        if (r && typeof r.x === 'number' && typeof r.y === 'number') {
          earRegions.push(r);
        }
      }
    }
    if (typeof er.targetX === 'number' && typeof er.targetY === 'number') {
      earRegions.push({ x: er.targetX, y: er.targetY, radius: er.radius || 58 });
    }
  }

  let finalEarRegions = earRegions;
  if (finalEarRegions.length < 2) {
    finalEarRegions = [
      { x: 180, y: 280, radius: 58 },
      { x: 520, y: 280, radius: 58 }
    ];
  } else if (finalEarRegions.length > 2) {
    finalEarRegions = finalEarRegions.slice(0, 2);
  }

  const consolidatedEars: FacePart = {
    id: 'ears',
    name: 'Đôi tai',
    spokenName: 'Đôi tai',
    description: 'Đôi tai! Bé có đôi tai xinh ở hai bên khuôn mặt để lắng nghe tiếng chim hót và lời cô dạy bảo.',
    audioMode: earAudioMode,
    audioUrl: earAudioUrl,
    hint: 'Bộ phận ở hai bên cạnh khuôn mặt, dùng để lắng nghe âm thanh.',
    regions: finalEarRegions
  };

  // 4. Consolidate NOSE
  const noseRegions: TargetRegion[] = [];
  if (nosePart) {
    if (Array.isArray(nosePart.regions)) {
      for (const r of nosePart.regions) {
        if (r && typeof r.x === 'number') noseRegions.push(r);
      }
    }
    if (typeof nosePart.targetX === 'number' && typeof nosePart.targetY === 'number') {
      noseRegions.push({ x: nosePart.targetX, y: nosePart.targetY, radius: nosePart.radius || 55 });
    }
  }

  const consolidatedNose: FacePart = {
    id: 'nose',
    name: 'Cái mũi',
    spokenName: 'Cái mũi',
    description: nosePart?.description || 'Cái mũi! Chiếc mũi xinh xắn ở chính giữa khuôn mặt, giúp bé hít thở và ngửi mùi hương thơm.',
    audioMode: nosePart?.audioMode || 'tts_only',
    audioUrl: nosePart?.audioUrl,
    hint: nosePart?.hint || 'Bộ phận nhỏ xinh ở ngay giữa khuôn mặt, dùng để hít thở và ngửi mùi thơm.',
    regions: noseRegions.length > 0 ? [noseRegions[0]] : [{ x: 350, y: 325, radius: 55 }]
  };

  // 5. Consolidate MOUTH
  const mouthRegions: TargetRegion[] = [];
  if (mouthPart) {
    if (Array.isArray(mouthPart.regions)) {
      for (const r of mouthPart.regions) {
        if (r && typeof r.x === 'number') mouthRegions.push(r);
      }
    }
    if (typeof mouthPart.targetX === 'number' && typeof mouthPart.targetY === 'number') {
      mouthRegions.push({ x: mouthPart.targetX, y: mouthPart.targetY, radius: mouthPart.radius || 68 });
    }
  }

  const consolidatedMouth: FacePart = {
    id: 'mouth',
    name: 'Cái miệng',
    spokenName: 'Cái miệng',
    description: mouthPart?.description || 'Cái miệng! Miệng xinh nở nụ cười thật tươi, biết hát những bài ca vui vẻ và ăn cơm thật ngoan.',
    audioMode: mouthPart?.audioMode || 'tts_only',
    audioUrl: mouthPart?.audioUrl,
    hint: mouthPart?.hint || 'Bộ phận nở nụ cười thật tươi, biết nói lời chào cô và ăn cơm ngoan.',
    regions: mouthRegions.length > 0 ? [mouthRegions[0]] : [{ x: 350, y: 405, radius: 68 }]
  };

  // Clean other custom parts
  const sanitizedOthers = otherParts.map((op, idx) => ({
    ...op,
    id: op.id || `custom-part-${idx}`,
    name: op.name || 'Bộ phận',
    spokenName: op.spokenName || op.name || 'Bộ phận',
    description: op.description || '',
    audioMode: op.audioMode || 'tts_only',
    regions: Array.isArray(op.regions) && op.regions.length > 0
      ? op.regions
      : [{ x: op.targetX || 350, y: op.targetY || 300, radius: op.radius || 55 }]
  }));

  // Canonical preschool order: Đôi mắt, Cái mũi, Cái miệng, Đôi tai + other custom
  const finalParts: FacePart[] = [
    consolidatedEyes,
    consolidatedNose,
    consolidatedMouth,
    consolidatedEars,
    ...sanitizedOthers
  ];

  return {
    ...theme,
    parts: finalParts
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  difficulty: 'easy',
  maskStyle: 'golden_sand',
  bgmEnabled: false,
  sfxEnabled: true,
  ttsRate: 0.95,
  magnification: 1.40
};

class StorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_FACE_THEMES)) {
          db.createObjectStore(STORE_FACE_THEMES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  public async getAllThemes(): Promise<FaceTheme[]> {
    try {
      const db = await this.openDB();
      return new Promise<FaceTheme[]>((resolve) => {
        const tx = db.transaction(STORE_FACE_THEMES, 'readonly');
        const store = tx.objectStore(STORE_FACE_THEMES);
        const req = store.getAll();

        req.onsuccess = async () => {
          let list = (req.result as FaceTheme[]) || [];
          if (list.length === 0) {
            list = INITIAL_FACE_THEMES;
            for (const theme of list) {
              await this.saveTheme(theme);
            }
          }
          const normalized = list.map(normalizeTheme);
          for (const normTheme of normalized) {
            this.saveTheme(normTheme).catch(() => {});
          }
          normalized.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
          resolve(normalized);
        };

        req.onerror = () => resolve(this.getLocalStorageThemes());
      });
    } catch {
      return this.getLocalStorageThemes();
    }
  }

  public async getThemeById(id: string): Promise<FaceTheme | null> {
    try {
      const db = await this.openDB();
      return new Promise<FaceTheme | null>((resolve) => {
        const tx = db.transaction(STORE_FACE_THEMES, 'readonly');
        const store = tx.objectStore(STORE_FACE_THEMES);
        const req = store.get(id);

        req.onsuccess = () => {
          const res = req.result as FaceTheme | null;
          resolve(res ? normalizeTheme(res) : null);
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      const list = this.getLocalStorageThemes();
      const found = list.find(t => t.id === id);
      return found ? normalizeTheme(found) : null;
    }
  }

  public async saveTheme(theme: FaceTheme, syncCloud: boolean = true): Promise<void> {
    const updated = {
      ...theme,
      updatedAt: Date.now()
    };

    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_FACE_THEMES, 'readwrite');
        const store = tx.objectStore(STORE_FACE_THEMES);
        const req = store.put(updated);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = this.getLocalStorageThemes();
      const idx = list.findIndex(t => t.id === theme.id);
      if (idx >= 0) list[idx] = updated;
      else list.unshift(updated);
      this.setLocalStorageThemes(list);
    }

    // If signed into Firebase, sync to Firestore
    if (syncCloud && auth.currentUser) {
      saveThemeToFirestore(updated, auth.currentUser.uid).catch(err => {
        console.warn('Background sync to Firestore failed:', err);
      });
    }
  }

  public async deleteTheme(id: string): Promise<void> {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_FACE_THEMES, 'readwrite');
        const store = tx.objectStore(STORE_FACE_THEMES);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = this.getLocalStorageThemes().filter(t => t.id !== id);
      this.setLocalStorageThemes(list);
    }

    // If signed into Firebase, also delete from Firestore
    if (auth.currentUser) {
      deleteThemeFromFirestore(id).catch(err => {
        console.warn('Background delete from Firestore failed:', err);
      });
    }
  }

  public async syncWithFirestore(): Promise<FaceTheme[]> {
    try {
      const cloudThemes = await fetchThemesFromFirestore();
      if (cloudThemes.length > 0) {
        for (const ct of cloudThemes) {
          await this.saveTheme(ct, false);
        }
      }
      return await this.getAllThemes();
    } catch (e) {
      console.warn('Sync with firestore failed, returning local themes:', e);
      return await this.getAllThemes();
    }
  }

  public async cloneTheme(id: string): Promise<FaceTheme | null> {
    const source = await this.getThemeById(id);
    if (!source) return null;

    const cloned: FaceTheme = {
      ...source,
      id: `face-clone-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `${source.title} (Bản sao)`,
      isCustom: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      parts: source.parts.map(p => ({
        ...p,
        id: `part-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
      }))
    };

    await this.saveTheme(cloned);
    return cloned;
  }

  public async getSettings(): Promise<AppSettings> {
    try {
      const db = await this.openDB();
      return new Promise<AppSettings>((resolve) => {
        const tx = db.transaction(STORE_SETTINGS, 'readonly');
        const store = tx.objectStore(STORE_SETTINGS);
        const req = store.get('app_settings');
        req.onsuccess = () => {
          if (req.result && req.result.value) {
            resolve({ ...DEFAULT_SETTINGS, ...req.result.value });
          } else {
            resolve(DEFAULT_SETTINGS);
          }
        };
        req.onerror = () => resolve(DEFAULT_SETTINGS);
      });
    } catch {
      const raw = localStorage.getItem('face_discovery_settings');
      if (raw) {
        try { return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }; } catch {}
      }
      return DEFAULT_SETTINGS;
    }
  }

  public async saveSettings(settings: AppSettings): Promise<void> {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_SETTINGS, 'readwrite');
        const store = tx.objectStore(STORE_SETTINGS);
        const req = store.put({ key: 'app_settings', value: settings });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      localStorage.setItem('face_discovery_settings', JSON.stringify(settings));
    }
  }

  public async exportBackup(): Promise<string> {
    const themes = await this.getAllThemes();
    const settings = await this.getSettings();
    const backupData = {
      version: 2,
      exportedAt: new Date().toISOString(),
      appName: 'Kính Lúp Khám Phá Khuôn Mặt',
      themes,
      settings
    };
    return JSON.stringify(backupData, null, 2);
  }

  public async importBackup(jsonString: string): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const data = JSON.parse(jsonString);
      if (!data || !Array.isArray(data.themes)) {
        return { success: false, count: 0, error: 'Tệp sao lưu không đúng định dạng của ứng dụng.' };
      }

      let count = 0;
      for (const item of data.themes) {
        if (item.id && item.title && Array.isArray(item.parts)) {
          await this.saveTheme(item);
          count++;
        }
      }

      if (data.settings) {
        await this.saveSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      }

      return { success: true, count };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định khi giải nén tệp.';
      return { success: false, count: 0, error: msg };
    }
  }

  private getLocalStorageThemes(): FaceTheme[] {
    try {
      const raw = localStorage.getItem('face_discovery_themes');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map(normalizeTheme);
      }
    } catch {}
    return INITIAL_FACE_THEMES;
  }

  private setLocalStorageThemes(themes: FaceTheme[]) {
    try {
      localStorage.setItem('face_discovery_themes', JSON.stringify(themes));
    } catch {}
  }
}

export const storageService = new StorageService();
