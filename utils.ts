
import { HappinessPillars } from './types';

// --- Shared Metadata ---
export const PILLARS_METADATA: { key: keyof HappinessPillars; label: string; icon: string }[] = [
  { key: 'physical', label: 'Physical Activity', icon: '🏋️' },
  { key: 'problemSolving', label: 'Complex Problem Solving', icon: '🧩' },
  { key: 'helping', label: 'Help people, Animals, Plants', icon: '🌱' },
  { key: 'creative', label: 'Creative work', icon: '🎨' },
  { key: 'explore', label: 'Explore New Places', icon: '🗺️' },
  { key: 'learning', label: 'Learned new thing', icon: '🧠' },
  { key: 'ideas', label: 'Worked on New Ideas', icon: '💡' },
  { key: 'qualityTime', label: 'Quality Time Together', icon: '🤝' },
  { key: 'progression', label: 'Progression in life', icon: '📈' },
];

export const NOTE_THEMES = [
  { name: 'Yellow', bg: 'bg-yellow-100', border: 'border-yellow-200', text: 'text-yellow-900', ring: 'ring-yellow-300' },
  { name: 'Mint', bg: 'bg-emerald-100', border: 'border-emerald-200', text: 'text-emerald-900', ring: 'ring-emerald-300' },
  { name: 'Sky', bg: 'bg-sky-100', border: 'border-sky-200', text: 'text-sky-900', ring: 'ring-sky-300' },
  { name: 'Peach', bg: 'bg-orange-100', border: 'border-orange-200', text: 'text-orange-900', ring: 'ring-orange-300' },
  { name: 'Lavender', bg: 'bg-purple-100', border: 'border-purple-200', text: 'text-purple-900', ring: 'ring-purple-300' },
  { name: 'Rose', bg: 'bg-rose-100', border: 'border-rose-200', text: 'text-rose-900', ring: 'ring-rose-300' },
];

// --- Audio Utility ---
export const SOUNDS = {
  SUCCESS: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  CLICK: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  REWARD: 'https://assets.mixkit.co/active_storage/sfx/1110/1110-preview.mp3',
  TRANSITION: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  POP: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
};

export const playSound = (url: string, volume: number = 0.3) => {
  const audio = new Audio(url);
  audio.volume = volume;
  audio.play().catch(() => {}); 
};
