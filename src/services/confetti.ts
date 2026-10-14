import confetti from 'canvas-confetti';

export function fireCelebrationConfetti() {
  try {
    // Left burst
    confetti({
      particleCount: 45,
      angle: 60,
      spread: 55,
      origin: { x: 0.1, y: 0.7 },
      colors: ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#EC4899']
    });

    // Right burst
    confetti({
      particleCount: 45,
      angle: 120,
      spread: 55,
      origin: { x: 0.9, y: 0.7 },
      colors: ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#EC4899']
    });

    // Center star shower
    setTimeout(() => {
      confetti({
        particleCount: 30,
        spread: 90,
        origin: { x: 0.5, y: 0.5 },
        shapes: ['circle'],
        scalar: 1.2,
        colors: ['#FDE047', '#F472B6', '#60A5FA']
      });
    }, 150);
  } catch {}
}
