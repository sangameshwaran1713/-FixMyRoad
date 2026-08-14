import React, { useState, useRef, useEffect } from 'react';

const BoundingBoxOverlay = ({ imageUrl, detections = [], originalWidth = 1920, originalHeight = 1080 }) => {
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
  const imgRef = useRef(null);

  const updateDimensions = () => {
    if (imgRef.current) {
      setImgDimensions({
        width: imgRef.current.clientWidth,
        height: imgRef.current.clientHeight,
      });
    }
  };

  useEffect(() => {
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const scaleX = originalWidth > 0 && imgDimensions.width > 0 ? imgDimensions.width / originalWidth : 1;
  const scaleY = originalHeight > 0 && imgDimensions.height > 0 ? imgDimensions.height / originalHeight : 1;

  const getClassColor = (cls) => {
    switch (cls) {
      case 'POTHOLE':
        return '#f43f5e'; // Rose
      case 'ROAD_CRACK':
        return '#a855f7'; // Purple
      case 'WATERLOGGING':
        return '#0284c7'; // Sky
      case 'OPEN_MANHOLE':
        return '#eab308'; // Amber
      default:
        return '#06b6d4'; // Cyan
    }
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900 shadow-xl flex items-center justify-center">
      <img
        ref={imgRef}
        src={imageUrl}
        alt="Road damage defect"
        onLoad={updateDimensions}
        className="max-h-[450px] w-auto object-contain rounded-2xl block mx-auto"
      />

      {/* SVG Bounding Box Overlay Layer */}
      {imgDimensions.width > 0 && detections.length > 0 && (
        <svg
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ width: imgDimensions.width, height: imgDimensions.height, left: '50%', transform: 'translateX(-50%)' }}
          viewBox={`0 0 ${imgDimensions.width} ${imgDimensions.height}`}
        >
          {detections.map((det, idx) => {
            const box = det.boundingBox || {};
            const x = Math.max(0, (box.x1 || 0) * scaleX);
            const y = Math.max(0, (box.y1 || 0) * scaleY);
            const w = Math.max(10, ((box.x2 || 0) - (box.x1 || 0)) * scaleX);
            const h = Math.max(10, ((box.y2 || 0) - (box.y1 || 0)) * scaleY);

            const color = getClassColor(det.class);
            const label = `${det.class} (${Math.round(det.confidence * 100)}%)`;

            return (
              <g key={idx}>
                {/* Bounding Box Rect */}
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill="none"
                  stroke={color}
                  strokeWidth="3"
                  strokeDasharray="none"
                  rx="4"
                />
                {/* Translucent overlay fill */}
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill={color}
                  fillOpacity="0.15"
                />
                {/* Label pill background */}
                <rect
                  x={x}
                  y={Math.max(0, y - 24)}
                  width={Math.min(w, label.length * 8 + 12)}
                  height="22"
                  fill={color}
                  rx="4"
                />
                {/* Label Text */}
                <text
                  x={x + 6}
                  y={Math.max(14, y - 9)}
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
};

export default BoundingBoxOverlay;
