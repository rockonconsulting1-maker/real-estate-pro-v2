import React, { useState, useRef, ReactNode } from 'react';

interface SwipeRowProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftActionNode?: ReactNode;
  rightActionNode?: ReactNode;
}

export function SwipeRow({ children, onSwipeLeft, onSwipeRight, leftActionNode, rightActionNode }: SwipeRowProps) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    currentX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    const dx = x - startX.current;
    const dy = y - startY.current;

    // If scrolling vertically, cancel swipe
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
      setIsDragging(false);
      setOffset(0);
      return;
    }

    currentX.current = x;
    
    // Constrain offset
    let newOffset = dx;
    if (newOffset > 100 && !leftActionNode) newOffset = 0;
    if (newOffset < -100 && !rightActionNode) newOffset = 0;
    
    if (newOffset > 100) newOffset = 100;
    if (newOffset < -100) newOffset = -100;
    
    setOffset(newOffset);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (offset > 50 && onSwipeRight) {
      onSwipeRight();
    } else if (offset < -50 && onSwipeLeft) {
      onSwipeLeft();
    } else if (offset < -50 && !onSwipeLeft) {
      // Keep open if no auto-trigger
      setOffset(-120);
      return;
    } else if (offset > 50 && !onSwipeRight) {
      setOffset(120);
      return;
    }

    // Reset offset
    setOffset(0);
  };

  return (
    <div className="relative overflow-hidden bg-muted">
      {/* Background Actions */}
      <div className="absolute inset-0 flex justify-between items-center px-4">
        <div className="flex-1 flex items-center justify-start opacity-100">
          {leftActionNode}
        </div>
        <div className="flex-1 flex items-center justify-end opacity-100">
          {rightActionNode}
        </div>
      </div>

      {/* Foreground Content */}
      <div
        className="relative bg-surface transition-transform duration-200 ease-out z-10"
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
