import React, { useRef, useEffect } from 'react';

export default function CanvasChart({ history = [], width = 300, height = 120, positive = true }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || history.length === 0) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const padding = 5;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min === 0 ? 1 : max - min;

    // Color definitions
    const primaryColor = positive ? '#10b981' : '#ef4444'; // Green or Red
    const shadowColor = positive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)';
    const gradientStart = positive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)';

    // 1. Draw Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    
    // Draw 3 horizontal gridlines
    for (let i = 1; i <= 3; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    ctx.setLineDash([]); // Reset dash

    // 2. Plot Points
    const points = history.map((val, idx) => {
      const x = padding + (idx / (history.length - 1)) * chartWidth;
      // Invert Y axis (canvas 0,0 is top left)
      const y = padding + chartHeight - ((val - min) / range) * chartHeight;
      return { x, y };
    });

    if (points.length < 2) return;

    // 3. Draw gradient area fill below chart line
    const areaGrd = ctx.createLinearGradient(0, 0, 0, height);
    areaGrd.addColorStop(0, gradientStart);
    areaGrd.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, height - padding);
    points.forEach(pt => {
      ctx.lineTo(pt.x, pt.y);
    });
    ctx.lineTo(points[points.length - 1].x, height - padding);
    ctx.closePath();
    ctx.fillStyle = areaGrd;
    ctx.fill();

    // 4. Draw Glow effect under line
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;

    // 5. Draw the chart line itself
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    // Draw smooth bezier curve or line
    for (let i = 0; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    // 6. Draw glowing end-point dot
    const endPt = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(endPt.x, endPt.y, 4, 0, 2 * Math.PI);
    ctx.fillStyle = primaryColor;
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 8;
    ctx.fill();

  }, [history, width, height, positive]);

  return (
    <div style={{ position: 'relative', width: `${width}px`, height: `${height}px` }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
