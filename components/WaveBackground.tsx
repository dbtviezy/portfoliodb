'use client';

import React, { useEffect, useRef, memo } from 'react';

const WaveBackground = memo(function WaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const rows = 54; 
    const cols = 90; 
    
    let time = 0;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = (e.clientX / width) * 2 - 1;
      mouseRef.current.targetY = (e.clientY / height) * 2 - 1;
      
      // Передаем координаты мыши в CSS-переменные для эффекта линзы
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      time += 0.003; 

      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      const landscapeWidth = width * 1.2; 
      const startLeft = -width * 0.1;
      const gapX = landscapeWidth / (cols - 1);

      for (let r = 0; r < rows; r++) {
        const points: { x: number; y: number }[] = [];
        const depth = r / (rows - 1);

        const baseY = height * 0.15 + (depth * (height * 0.75));

        for (let c = 0; c < cols; c++) {
          const startX = startLeft + c * gapX;
          const xNormalized = c / (cols - 1);

          const angleX = xNormalized * Math.PI * 4.5 + time * 1.0;
          const angleY = depth * Math.PI * 2.2 - time * 0.5;
          
          let wave = Math.sin(angleX) * Math.cos(angleY) * 85;
          wave += Math.sin(xNormalized * Math.PI * 10 + time * 2.0) * 12; 

          const amplitude = wave * (0.2 + depth * 0.8);

          const mouseDist = xNormalized - (mouse.x * 0.5 + 0.5);
          const mouseInfluence = Math.exp(-Math.pow(mouseDist * 4, 2));
          const mouseOffset = mouse.y * -50 * mouseInfluence * depth;

          const finalX = startX;
          const finalY = baseY + amplitude + mouseOffset;

          points.push({ x: finalX, y: finalY });
        }

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.lineTo(points[points.length - 1].x, height + 200); 
        ctx.lineTo(points[0].x, height + 200);
        ctx.closePath();
        ctx.fillStyle = '#0a0a0a'; 
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.02 + depth * 0.16})`; 
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      <canvas ref={canvasRef} className="w-full h-full block opacity-100" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#0a0a0a] via-transparent to-[#0a0a0a] opacity-40" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#0a0a0a] via-transparent via-80% to-[#0a0a0a] opacity-20" />
    </div>
  );
});

export default WaveBackground;