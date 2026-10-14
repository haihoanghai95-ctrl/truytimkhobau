import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MaskStyle, FacePart, TargetRegion } from '../types';
import { soundEffects } from '../services/soundEffects';

interface MagnifyingGlassCanvasProps {
  faceImageUrl: string;
  isFullRevealed: boolean;
  highlightedPart: FacePart | null;
  lensRadius: number;
  magnification: number;
  maskStyle: MaskStyle;
  onFirstInteraction?: () => void;
  onStartDrag?: () => void;
  onLensMove?: (coords: { x: number; y: number }) => void;
}

export const MagnifyingGlassCanvas: React.FC<MagnifyingGlassCanvasProps> = ({
  faceImageUrl,
  isFullRevealed,
  highlightedPart,
  lensRadius,
  magnification,
  onFirstInteraction,
  onStartDrag,
  onLensMove
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const V_WIDTH = 800;
  const V_HEIGHT = 600;

  // 1. CONTEXT CACHING: Cache main canvas 2D context and offscreen mask canvas
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 2. REQUEST ANIMATION FRAME & PERFORMANCE REFS
  // Keep live lens position in a mutable ref to decouple high-frequency touch moves from React re-renders
  const lensPosRef = useRef<{ x: number; y: number }>({ x: 350, y: 195 });
  const isDraggingRef = useRef(false);
  const rafIdRef = useRef<number>(0);
  const imageObjRef = useRef<HTMLImageElement | null>(null);
  const lastSoundTimeRef = useRef<number>(0);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Helper to draw cute subtle sparkles & stars
  const drawSparkleShape = (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.quadraticCurveTo(cx, cy, cx + size, cy);
    ctx.quadraticCurveTo(cx, cy, cx, cy + size);
    ctx.quadraticCurveTo(cx, cy, cx - size, cy);
    ctx.quadraticCurveTo(cx, cy, cx, cy - size);
    ctx.fill();
  };

  // Pre-render the 100% Solid Cream Mask into an off-screen cache canvas
  // Drawing a pre-rasterized canvas is up to 100x faster on mobile/touch screens than re-generating gradients and bezier curves
  const getOrCreateMaskCache = useCallback((): HTMLCanvasElement => {
    if (maskCanvasRef.current) return maskCanvasRef.current;

    const offscreen = document.createElement('canvas');
    offscreen.width = V_WIDTH;
    offscreen.height = V_HEIGHT;
    const octx = offscreen.getContext('2d');
    if (!octx) return offscreen;

    // 100% OPAQUE Solid Warm Cream-Yellow Field
    octx.fillStyle = '#FEF9C3';
    octx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

    // Warm radial glow in center
    const glow = octx.createRadialGradient(V_WIDTH / 2, V_HEIGHT / 2, 50, V_WIDTH / 2, V_HEIGHT / 2, 420);
    glow.addColorStop(0, '#FEF08A');
    glow.addColorStop(1, '#FDE68A');
    octx.fillStyle = glow;
    octx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

    // Secret sparkle & tiny star doodles
    octx.fillStyle = '#F59E0B';
    octx.strokeStyle = '#D97706';

    const sparkles = [
      { x: 120, y: 90, s: 8 }, { x: 260, y: 70, s: 6 }, { x: 480, y: 80, s: 9 }, { x: 680, y: 100, s: 7 },
      { x: 90, y: 220, s: 6 }, { x: 720, y: 230, s: 8 },
      { x: 100, y: 380, s: 9 }, { x: 710, y: 370, s: 6 },
      { x: 130, y: 520, s: 7 }, { x: 300, y: 540, s: 8 }, { x: 500, y: 530, s: 6 }, { x: 670, y: 510, s: 9 }
    ];

    sparkles.forEach(pt => {
      octx.save();
      octx.globalAlpha = 0.28;
      drawSparkleShape(octx, pt.x, pt.y, pt.s);
      octx.restore();
    });

    // Tiny golden glitter polka dots
    octx.save();
    octx.globalAlpha = 0.22;
    octx.fillStyle = '#D97706';
    const dots = [
      { x: 180, y: 150 }, { x: 620, y: 160 }, { x: 160, y: 300 }, { x: 640, y: 310 },
      { x: 190, y: 460 }, { x: 610, y: 450 }, { x: 390, y: 90 }, { x: 410, y: 540 }
    ];
    dots.forEach(d => {
      octx.beginPath();
      octx.arc(d.x, d.y, 4, 0, Math.PI * 2);
      octx.fill();
    });
    octx.restore();

    // Cheerful playful inner frame border
    octx.strokeStyle = '#FCD34D';
    octx.lineWidth = 10;
    octx.strokeRect(10, 10, V_WIDTH - 20, V_HEIGHT - 20);

    maskCanvasRef.current = offscreen;
    return offscreen;
  }, []);

  // Pre-load the face image
  useEffect(() => {
    setImageLoaded(false);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = faceImageUrl;
    img.onload = () => {
      imageObjRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => {
      setImageLoaded(false);
    };
  }, [faceImageUrl]);

  // Transform client pointer coordinates to virtual coordinates (800 x 600)
  const getVirtualCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: V_WIDTH / 2, y: V_HEIGHT / 2 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = V_WIDTH / rect.width;
    const scaleY = V_HEIGHT / rect.height;

    const pad = 40;
    const x = Math.max(pad, Math.min(V_WIDTH - pad, (clientX - rect.left) * scaleX));
    const y = Math.max(pad, Math.min(V_HEIGHT - pad, (clientY - rect.top) * scaleY));

    return { x, y };
  }, []);

  // Magnifying glass chrome helper
  const drawMagnifyingGlassChrome = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number
  ) => {
    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.28)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = 6;
    ctx.shadowOffsetY = 10;

    const angle = (42 * Math.PI) / 180;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const rimOuterR = radius + 9;
    const handleStartX = x + (rimOuterR - 4) * cosA;
    const handleStartY = y + (rimOuterR - 4) * sinA;
    const handleLength = 115;
    const handleEndX = handleStartX + handleLength * cosA;
    const handleEndY = handleStartY + handleLength * sinA;

    // Handle
    ctx.save();
    const handleGrad = ctx.createLinearGradient(
      handleStartX - 10 * sinA, handleStartY + 10 * cosA,
      handleStartX + 10 * sinA, handleStartY - 10 * cosA
    );
    handleGrad.addColorStop(0, '#78350F');
    handleGrad.addColorStop(0.35, '#B45309');
    handleGrad.addColorStop(0.7, '#D97706');
    handleGrad.addColorStop(1, '#78350F');

    ctx.beginPath();
    ctx.moveTo(handleStartX, handleStartY);
    ctx.lineTo(handleEndX, handleEndY);
    ctx.lineWidth = 24;
    ctx.strokeStyle = handleGrad;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Metallic Brass Connector Collar
    ctx.beginPath();
    ctx.moveTo(handleStartX, handleStartY);
    ctx.lineTo(handleStartX + 22 * cosA, handleStartY + 22 * sinA);
    ctx.lineWidth = 28;
    ctx.strokeStyle = '#F59E0B';
    ctx.lineCap = 'butt';
    ctx.stroke();

    // Knob
    ctx.beginPath();
    ctx.arc(handleEndX, handleEndY, 15, 0, Math.PI * 2);
    ctx.fillStyle = '#D97706';
    ctx.fill();
    ctx.restore();

    // Outer Rim
    const rimGrad = ctx.createLinearGradient(
      x - radius, y - radius,
      x + radius, y + radius
    );
    rimGrad.addColorStop(0, '#FEF08A');
    rimGrad.addColorStop(0.3, '#F59E0B');
    rimGrad.addColorStop(0.7, '#D97706');
    rimGrad.addColorStop(1, '#B45309');

    ctx.beginPath();
    ctx.arc(x, y, radius + 7, 0, Math.PI * 2);
    ctx.lineWidth = 14;
    ctx.strokeStyle = rimGrad;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, radius + 1, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#78350F';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, radius + 14, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#451A03';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, radius + 8, -Math.PI * 0.8, -Math.PI * 0.45);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.restore();
  };

  // Core canvas render function using cached context & cached mask
  const renderCanvas = useCallback((pos: { x: number; y: number }) => {
    // 1. Retrieve or cache the 2D context
    let ctx = ctxRef.current;
    if (!ctx) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      ctx = canvas.getContext('2d');
      ctxRef.current = ctx;
    }
    if (!ctx) return;

    ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);

    const img = imageObjRef.current;

    // Draw area geometry (exact 1:1 virtual coordinate alignment for 800x600 SVG)
    let imgW = V_WIDTH;
    let imgH = V_HEIGHT;
    let imgX = 0;
    let imgY = 0;

    if (img && img.naturalWidth && img.naturalHeight) {
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const areaAspect = V_WIDTH / V_HEIGHT;

      if (imgAspect > areaAspect) {
        imgW = V_WIDTH;
        imgH = V_WIDTH / imgAspect;
        imgX = 0;
        imgY = (V_HEIGHT - imgH) / 2;
      } else {
        imgH = V_HEIGHT;
        imgW = V_HEIGHT * imgAspect;
        imgX = (V_WIDTH - imgW) / 2;
        imgY = 0;
      }
    }

    // =========================================================================
    // SCENARIO 1: FULL FACE REVEALED ("HIỆN KHUÔN MẶT")
    // =========================================================================
    if (isFullRevealed) {
      const bgGrad = ctx.createRadialGradient(V_WIDTH / 2, V_HEIGHT / 2, 80, V_WIDTH / 2, V_HEIGHT / 2, 450);
      bgGrad.addColorStop(0, '#FFFBEB');
      bgGrad.addColorStop(1, '#FEF3C7');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

      if (img && imageLoaded) {
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
        ctx.shadowBlur = 24;
        ctx.drawImage(img, imgX, imgY, imgW, imgH);
        ctx.restore();
      }

      ctx.strokeStyle = '#FCD34D';
      ctx.lineWidth = 10;
      ctx.strokeRect(8, 8, V_WIDTH - 16, V_HEIGHT - 16);
      return;
    }

    // Get the cached 100% solid cream mask canvas
    const maskCache = getOrCreateMaskCache();

    // =========================================================================
    // SCENARIO 2: PART HIGHLIGHTED ("HIỆN ĐÁP ÁN")
    // =========================================================================
    if (highlightedPart) {
      // 1. Draw 100% SOLID cream-yellow background covering EVERYTHING via cached canvas
      ctx.drawImage(maskCache, 0, 0);

      const regions: TargetRegion[] = (Array.isArray(highlightedPart.regions) && highlightedPart.regions.length > 0)
        ? highlightedPart.regions
        : (typeof highlightedPart.targetX === 'number' && typeof highlightedPart.targetY === 'number')
        ? [{ x: highlightedPart.targetX, y: highlightedPart.targetY, radius: highlightedPart.radius || 55 }]
        : [{ x: 350, y: 300, radius: 55 }];

      // 2. Cut out and draw ONLY the revealed part's regions with optical clarity
      if (img && imageLoaded) {
        ctx.save();
        ctx.beginPath();
        regions.forEach(reg => {
          ctx.moveTo(reg.x + reg.radius + 16, reg.y);
          ctx.arc(reg.x, reg.y, reg.radius + 16, 0, Math.PI * 2);
        });
        ctx.clip();
        ctx.drawImage(img, imgX, imgY, imgW, imgH);
        ctx.restore();
      }

      // 3. Glowing golden rings and celebration sparkles around ONLY this part's regions!
      ctx.save();
      ctx.shadowColor = '#F59E0B';
      ctx.shadowBlur = 24;

      regions.forEach(reg => {
        ctx.beginPath();
        ctx.arc(reg.x, reg.y, reg.radius + 16, 0, Math.PI * 2);
        ctx.lineWidth = 7;
        ctx.strokeStyle = '#FACC15';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(reg.x, reg.y, reg.radius + 21, 0, Math.PI * 2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();
      });
      ctx.restore();

      // 4. Prominent part title badge floating above the revealed regions
      ctx.save();
      const validRegions = regions.filter(r => r && typeof r.x === 'number' && typeof r.y === 'number');
      const avgX = validRegions.length > 0 ? validRegions.reduce((sum, r) => sum + r.x, 0) / validRegions.length : V_WIDTH / 2;
      const minY = validRegions.length > 0 ? Math.min(...validRegions.map(r => r.y - (r.radius || 50))) : 100;
      const badgeY = Math.max(26, minY - 44);

      const text = ((highlightedPart && highlightedPart.name) || 'BỘ PHẬN').toUpperCase();
      ctx.font = 'bold 22px "Nunito", sans-serif';
      const textMetrics = ctx.measureText(text);
      const badgeW = textMetrics.width + 48;
      const badgeX = avgX - badgeW / 2;
      const badgeH = 38;
      const badgeRadius = 19;

      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(badgeX, badgeY, badgeW, badgeH, badgeRadius);
      } else {
        ctx.moveTo(badgeX + badgeRadius, badgeY);
        ctx.arcTo(badgeX + badgeW, badgeY, badgeX + badgeW, badgeY + badgeH, badgeRadius);
        ctx.arcTo(badgeX + badgeW, badgeY + badgeH, badgeX, badgeY + badgeH, badgeRadius);
        ctx.arcTo(badgeX, badgeY + badgeH, badgeX, badgeY, badgeRadius);
        ctx.arcTo(badgeX, badgeY, badgeX + badgeW, badgeY, badgeRadius);
        ctx.closePath();
      }
      ctx.fill();

      ctx.lineWidth = 3;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, avgX, badgeY + 19);
      ctx.restore();

      // 5. ALSO draw the magnifying glass over current position with magnified view
      if (img && imageLoaded) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, lensRadius, 0, Math.PI * 2);
        ctx.clip();

        ctx.fillStyle = '#FEF3C7';
        ctx.fill();

        ctx.save();
        const zoomFactor = magnification || 1.4;
        ctx.translate(pos.x, pos.y);
        ctx.scale(zoomFactor, zoomFactor);
        ctx.translate(-pos.x, -pos.y);
        ctx.drawImage(img, imgX, imgY, imgW, imgH);
        ctx.restore();

        // Optical glass specular reflection
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, lensRadius - 10, -Math.PI * 0.72, -Math.PI * 0.28);
        ctx.lineWidth = 5;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();
      }

      drawMagnifyingGlassChrome(ctx, pos.x, pos.y, lensRadius);
      return;
    }

    // =========================================================================
    // SCENARIO 3: MYSTERY EXPLORATION MODE WITH 100% OPAQUE SOLID CREAM MASK!
    // =========================================================================
    // 1. Draw 100% SOLID cream-yellow background via ultra-fast cached offscreen canvas
    ctx.drawImage(maskCache, 0, 0);

    // 2. Draw real underlying image ONLY inside the circular lens
    if (img && imageLoaded) {
      ctx.save();

      // Circular clip strictly confined to the magnifying glass
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, lensRadius, 0, Math.PI * 2);
      ctx.clip();

      // Fill circular clip with clean backing
      ctx.fillStyle = '#FEF3C7';
      ctx.fill();

      // Draw real image magnified 1.35x - 1.45x centered precisely on lens position
      ctx.save();
      const zoomFactor = magnification || 1.40;
      ctx.translate(pos.x, pos.y);
      ctx.scale(zoomFactor, zoomFactor);
      ctx.translate(-pos.x, -pos.y);
      ctx.drawImage(img, imgX, imgY, imgW, imgH);
      ctx.restore();

      // Realistic optical glass shading at perimeter
      const glassGrad = ctx.createRadialGradient(
        pos.x, pos.y, lensRadius * 0.65,
        pos.x, pos.y, lensRadius
      );
      glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      glassGrad.addColorStop(0.82, 'rgba(180, 220, 255, 0.16)');
      glassGrad.addColorStop(1, 'rgba(37, 99, 235, 0.35)');
      ctx.fillStyle = glassGrad;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, lensRadius, 0, Math.PI * 2);
      ctx.fill();

      // Optical curving specular highlight glints
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, lensRadius - 10, -Math.PI * 0.72, -Math.PI * 0.28);
      ctx.lineWidth = 6;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, lensRadius - 20, -Math.PI * 0.65, -Math.PI * 0.35);
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.restore();
    }

    // 3. Draw the cartoon magnifying glass frame & wooden handle
    drawMagnifyingGlassChrome(ctx, pos.x, pos.y, lensRadius);
  }, [getOrCreateMaskCache, lensRadius, magnification, isFullRevealed, highlightedPart, imageLoaded]);

  // Request Animation Frame Scheduler
  // Collapses multiple touch/pointer move events into a single render synchronized to display refresh rate
  const scheduleRender = useCallback(() => {
    if (rafIdRef.current) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = 0;
      renderCanvas(lensPosRef.current);
    });
  }, [renderCanvas]);

  // Initial draw and reactive updates when props or image change
  useEffect(() => {
    scheduleRender();
  }, [scheduleRender, imageLoaded, isFullRevealed, highlightedPart, lensRadius, magnification]);

  // Clean up any pending animation frame on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = 0;
      }
    };
  }, []);

  // Pointer & Touch handlers (using rAF + ref, zero React state overhead during drag)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isFullRevealed) return;
    const coords = getVirtualCoords(e.clientX, e.clientY);
    lensPosRef.current = coords;
    isDraggingRef.current = true;
    setHasInteracted(true);
    onFirstInteraction?.();
    onStartDrag?.();
    onLensMove?.(coords);
    scheduleRender();

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    soundEffects.playPop();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || isFullRevealed) return;
    const coords = getVirtualCoords(e.clientX, e.clientY);
    lensPosRef.current = coords;
    onLensMove?.(coords);
    scheduleRender();

    const now = Date.now();
    if (now - lastSoundTimeRef.current > 240) {
      soundEffects.playSearchTwinkle();
      lastSoundTimeRef.current = now;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    scheduleRender();
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl bg-white border-4 border-amber-300 select-none touch-none"
    >
      <canvas
        ref={canvasRef}
        width={V_WIDTH}
        height={V_HEIGHT}
        className="w-full h-full object-contain cursor-grab active:cursor-grabbing block"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />

      {/* Guide hint for toddlers & teachers */}
      {!isFullRevealed && !highlightedPart && !hasInteracted && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 pointer-events-none flex items-center gap-2.5 bg-amber-950/85 backdrop-blur-sm text-white px-5 py-2.5 rounded-full shadow-lg border border-amber-200/50 animate-bounce">
          <span className="text-xl">🔍</span>
          <span className="text-xs sm:text-sm font-bold">Kéo kính lúp để soi đôi mắt, cái mũi, cái miệng hoặc đôi tai!</span>
        </div>
      )}
    </div>
  );
};
