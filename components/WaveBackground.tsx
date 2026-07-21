"use client";

import { useEffect, useRef, memo } from "react";

const WaveBackground = memo(function WaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    // Transparent canvas so page/hero gradients show through
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let animationFrameId = 0;
    let width = 0;
    let height = 0;
    let time = 0;
    let running = true;

    const isCoarse = window.matchMedia("(pointer: coarse)").matches;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isNarrow = () => window.innerWidth < 768;

    const quality = () => {
      if (prefersReduced) return { rows: 18, cols: 36, dpr: 1 };
      if (isNarrow() || isCoarse)
        return { rows: 28, cols: 48, dpr: Math.min(window.devicePixelRatio || 1, 1.25) };
      return { rows: 40, cols: 72, dpr: Math.min(window.devicePixelRatio || 1, 1.5) };
    };

    const resize = () => {
      const { dpr } = quality();
      const rect = wrap.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width || window.innerWidth));
      height = Math.max(1, Math.floor(rect.height || window.innerHeight));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onMouseMove = (e: MouseEvent) => {
      mouse.targetX = (e.clientX / width) * 2 - 1;
      mouse.targetY = (e.clientY / height) * 2 - 1;
    };

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 120);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        running = entry.isIntersecting;
        if (running) animationFrameId = requestAnimationFrame(draw);
      },
      { threshold: 0.05 }
    );
    observer.observe(wrap);

    resize();
    window.addEventListener("resize", onResize);
    if (!isCoarse) window.addEventListener("mousemove", onMouseMove, { passive: true });

    const draw = () => {
      if (!running) return;

      const { rows, cols } = quality();
      time += prefersReduced ? 0.0015 : 0.003;

      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      const landscapeWidth = width * 1.2;
      const startLeft = -width * 0.1;
      const gapX = landscapeWidth / Math.max(cols - 1, 1);
      const ampScale = Math.min(height * 0.12, 85);

      for (let r = 0; r < rows; r++) {
        const depth = r / Math.max(rows - 1, 1);
        const baseY = height * 0.18 + depth * (height * 0.7);

        ctx.beginPath();
        for (let c = 0; c < cols; c++) {
          const xNormalized = c / Math.max(cols - 1, 1);
          const startX = startLeft + c * gapX;
          const angleX = xNormalized * Math.PI * 4.5 + time;
          const angleY = depth * Math.PI * 2.2 - time * 0.5;

          let wave = Math.sin(angleX) * Math.cos(angleY) * ampScale;
          wave += Math.sin(xNormalized * Math.PI * 10 + time * 2) * (ampScale * 0.14);

          const amplitude = wave * (0.2 + depth * 0.8);
          let mouseOffset = 0;
          if (!isCoarse) {
            const mouseDist = xNormalized - (mouse.x * 0.5 + 0.5);
            const mouseInfluence = Math.exp(-((mouseDist * 4) ** 2));
            mouseOffset = mouse.y * -40 * mouseInfluence * depth;
          }

          const x = startX;
          const y = baseY + amplitude + mouseOffset;
          if (c === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.strokeStyle = `rgba(255,255,255,${0.03 + depth * 0.16})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      running = false;
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.clearTimeout(resizeTimer);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div ref={wrapRef} className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-hidden">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
});

export default WaveBackground;
