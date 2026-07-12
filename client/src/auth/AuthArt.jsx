import { motion } from 'framer-motion';

/**
 * The illustration on the sign-in screen.
 *
 * It draws the actual product rather than a generic person-at-a-laptop: one
 * file, two carets with name flags, and the assistant writing into it from
 * below. Flat shapes, hairline strokes, and the app's own palette — no gradients.
 */

// Each row of "code": a list of [x, width, className] bars.
const LINES = [
  [[24, 52, 'fill-accent'], [84, 84, 'fill-muted/30']],
  [[38, 40, 'fill-muted/50'], [86, 60, 'fill-muted/25']],
  [[38, 70, 'fill-muted/35'], [116, 34, 'fill-accent/60']],
  [[24, 46, 'fill-accent'], [78, 52, 'fill-muted/30']],
  [[38, 92, 'fill-muted/25']],
  [[38, 58, 'fill-muted/35'], [104, 44, 'fill-muted/25']],
  [[24, 30, 'fill-accent/60']],
];

const PEER = '#38BDF8'; // the second caret — same sky used for numbers in the editor theme

// A caret that blinks, out of phase with the other one.
const blink = (delay) => ({
  animate: { opacity: [1, 1, 0, 0, 1] },
  transition: { duration: 1.2, delay, repeat: Infinity, ease: 'linear', times: [0, 0.45, 0.5, 0.95, 1] },
});

export default function AuthArt() {
  return (
    <svg viewBox="0 0 420 350" className="w-full" role="img" aria-label="Two people editing one file while an assistant writes into it">
      {/* the file everyone is looking at */}
      <rect x="6" y="18" width="300" height="252" rx="14" className="fill-surface stroke-border" strokeWidth="1" />

      {/* file tab */}
      <rect x="22" y="34" width="82" height="22" rx="6" className="fill-elevated stroke-border" strokeWidth="1" />
      <circle cx="34" cy="45" r="3.5" className="fill-accent" />
      <rect x="44" y="41" width="48" height="7" rx="3.5" className="fill-muted/40" />
      <line x1="6" y1="70" x2="306" y2="70" className="stroke-border" strokeWidth="1" />

      {/* the code */}
      {LINES.map((bars, row) =>
        bars.map(([x, width, className], index) => (
          <motion.rect
            key={`${row}-${index}`}
            x={x}
            y={90 + row * 24}
            width={width}
            height="8"
            rx="4"
            className={className}
            style={{ originX: 0, originY: 0.5 }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.15 + row * 0.07 + index * 0.04, duration: 0.4, ease: 'easeOut' }}
          />
        )),
      )}

      {/* you */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
        <rect x="156" y="120" width="38" height="16" rx="4" className="fill-accent" />
        <text x="163" y="132" className="fill-[#1C1917]" style={{ font: '500 9px "JetBrains Mono", monospace' }}>
          you
        </text>
        <motion.rect x="157" y="136" width="2.5" height="18" rx="1.25" className="fill-accent" {...blink(0)} />
      </motion.g>

      {/* them */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>
        <rect x="132" y="168" width="40" height="16" rx="4" fill={PEER} />
        <text x="139" y="180" className="fill-[#1C1917]" style={{ font: '500 9px "JetBrains Mono", monospace' }}>
          sam
        </text>
        <motion.rect x="133" y="184" width="2.5" height="18" rx="1.25" fill={PEER} {...blink(0.6)} />
      </motion.g>

      {/* the assistant, writing into the file from below */}
      <motion.g
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3, duration: 0.5, ease: 'easeOut' }}
      >
        <rect x="196" y="234" width="218" height="106" rx="14" className="fill-surface stroke-border" strokeWidth="1" />

        {/* the amber mark, same one that sits in the top bar */}
        <rect x="212" y="250" width="28" height="28" rx="9" className="fill-accent" />
        <path
          d="M226 253.5 l3.2 7.3 7.3 3.2 -7.3 3.2 -3.2 7.3 -3.2 -7.3 -7.3 -3.2 7.3 -3.2 z"
          className="fill-[#1C1917]"
        />

        <rect x="250" y="254" width="118" height="7" rx="3.5" className="fill-muted/35" />
        <rect x="250" y="268" width="80" height="7" rx="3.5" className="fill-muted/25" />

        {/* the code block it just produced */}
        <rect x="212" y="292" width="186" height="32" rx="9" className="fill-bg stroke-border" strokeWidth="1" />
        <rect x="224" y="304" width="42" height="7" rx="3.5" className="fill-accent/70" />
        <rect x="274" y="304" width="96" height="7" rx="3.5" className="fill-muted/30" />
      </motion.g>
    </svg>
  );
}
