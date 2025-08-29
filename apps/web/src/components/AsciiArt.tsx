import React from 'react';
import { cn } from '@/lib/utils';

export interface AsciiArtProps {
  ascii?: string;
  label?: string;
  ariaLabel?: string;
  variant?: 'badge' | 'avatar' | 'empty' | 'display' | 'inline';
  className?: string;
  animate?: boolean;
}

export function AsciiArt({
  ascii,
  label,
  ariaLabel,
  variant = 'inline',
  className,
  animate = false,
}: AsciiArtProps) {
  const safe = typeof ascii === 'string' && ascii.trim().length > 0 
    ? ascii 
    : '[ASCII PLACEHOLDER]';

  const baseClasses = 'font-mono select-text';
  
  const variantClasses = {
    badge: 'text-xs leading-none',
    avatar: 'text-sm leading-none',
    empty: 'text-lg leading-tight opacity-50',
    display: 'text-xl leading-tight',
    inline: 'text-sm leading-none',
  };

  const animationClasses = animate ? 'animate-pulse' : '';

  // Log warning for missing ASCII
  if (!ascii || ascii.trim().length === 0) {
    console.warn('AsciiArt: No ASCII content provided', { label, ariaLabel });
  }

  return (
    <figure 
      aria-label={ariaLabel || label} 
      className={cn('inline-block', className)}
    >
      <pre 
        className={cn(
          baseClasses,
          variantClasses[variant],
          animationClasses,
          'whitespace-pre overflow-hidden'
        )}
      >
        {safe}
      </pre>
      {label && (
        <figcaption className="mt-2 text-xs opacity-80 text-center">
          {label}
        </figcaption>
      )}
    </figure>
  );
}

// Animated ASCII component for special effects
export function AnimatedAsciiArt({ 
  frames, 
  fps = 2,
  ...props 
}: AsciiArtProps & { 
  frames: string[]; 
  fps?: number;
}) {
  const [frameIndex, setFrameIndex] = React.useState(0);

  React.useEffect(() => {
    if (frames.length <= 1) return;

    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [frames, fps]);

  return <AsciiArt {...props} ascii={frames[frameIndex]} />;
}

// Loading spinner ASCII
export function AsciiSpinner({ label = 'Loading...' }: { label?: string }) {
  const frames = [
    '◐',
    '◓',
    '◑',
    '◒'
  ];

  return (
    <AnimatedAsciiArt
      frames={frames}
      fps={4}
      label={label}
      variant="inline"
      ariaLabel="Loading"
    />
  );
}

// Progress bar ASCII
export function AsciiProgress({ 
  value, 
  max = 100,
  width = 10,
  showPercent = true 
}: { 
  value: number; 
  max?: number;
  width?: number;
  showPercent?: boolean;
}) {
  const percentage = Math.round((value / max) * 100);
  const filled = Math.round((value / max) * width);
  const empty = width - filled;
  
  const bar = `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
  const display = showPercent ? `${bar} ${percentage}%` : bar;

  return (
    <AsciiArt
      ascii={display}
      variant="inline"
      ariaLabel={`Progress: ${percentage} percent`}
    />
  );
}