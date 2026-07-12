import { useCallback, useEffect, useRef, useState } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery.js';
import { cn } from '../../lib/cn.js';

/**
 * Two panes with a draggable divider on desktop; stacked vertically on mobile.
 *
 * The divider is a 1px line, but the invisible strip around it is 8px wide so
 * it's actually grabbable with a mouse.
 */
export default function SplitPane({ left, right, initialRatio = 0.58, minRatio = 0.28, maxRatio = 0.75 }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const containerRef = useRef(null);
  const [ratio, setRatio] = useState(initialRatio);
  const [dragging, setDragging] = useState(false);

  const handleMove = useCallback(
    (event) => {
      const container = containerRef.current;
      if (!container) return;

      const { left: originX, width } = container.getBoundingClientRect();
      const next = (event.clientX - originX) / width;
      setRatio(Math.min(maxRatio, Math.max(minRatio, next)));
    },
    [minRatio, maxRatio],
  );

  // Listen on the window, not the divider: the pointer moves faster than React
  // re-renders and would otherwise escape the 8px strip mid-drag.
  useEffect(() => {
    if (!dragging) return;

    const stop = () => setDragging(false);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', stop);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', stop);
    };
  }, [dragging, handleMove]);

  return (
    <div
      ref={containerRef}
      className={cn('flex h-full flex-col lg:flex-row', dragging && 'select-none')}
    >
      <section
        className="min-h-0 min-w-0 flex-1 lg:flex-none"
        style={isDesktop ? { flexBasis: `${ratio * 100}%` } : undefined}
      >
        {left}
      </section>

      <div
        role="separator"
        aria-orientation="vertical"
        className={cn('relative hidden w-px shrink-0 lg:block', dragging ? 'bg-accent' : 'bg-border')}
      >
        <div
          onPointerDown={() => setDragging(true)}
          className="absolute inset-y-0 -left-1 -right-1 cursor-col-resize"
        />
      </div>

      <section className="min-h-0 min-w-0 flex-1 border-t border-border lg:border-t-0">
        {right}
      </section>
    </div>
  );
}
