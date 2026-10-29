# Springs, Easing Curves & Velocity Timing in Remotion

In Remotion, motion is driven by frame numbers rather than time-based CSS transitions. To achieve agency-grade motion, avoid generic default springs and employ calibrated physics profiles.

---

## Calibrated Spring Presets

Use `spring()` from `remotion` with specialized configs depending on the object's physical identity:

```tsx
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';

const frame = useCurrentFrame();
const { fps } = useVideoConfig();
```

### 1. The Mechanical Shutter (Micro-UI, Badges, Typography, Reticles)
Ultra-fast snap with zero sluggishness. Reaches target in 6–10 frames.
```tsx
const shutterSpring = spring({
  frame,
  fps,
  config: {
    damping: 12,
    stiffness: 380,
    mass: 0.45,
  },
  from: 0,
  to: 1,
});
```

### 2. The Heavy Monolith (Devices, Large Viewports, Architectural Panels)
Feels like a sheet of milled aluminum or heavy plate glass moving into frame.
```tsx
const monolithSpring = spring({
  frame,
  fps,
  config: {
    damping: 24,
    stiffness: 110,
    mass: 2.4,
  },
  from: 120, // Slide up from 120px
  to: 0,
});
```

### 3. The Elastic Whiplash (Notifications, Floating Emblems, Pill Badges)
Features intentional, controlled overshoot before resting.
```tsx
const whipSpring = spring({
  frame,
  fps,
  config: {
    damping: 9,
    stiffness: 240,
    mass: 0.65,
  },
  from: 0.4,
  to: 1.0,
});
```

### 4. The Velvet Settle (Hero Product reveals, Luxury transitions)
Smooth, silky, premium deceleration with zero bounce.
```tsx
const velvetSpring = spring({
  frame,
  fps,
  config: {
    damping: 30,
    stiffness: 140,
    mass: 1.2,
  },
  from: 0,
  to: 1,
});
```

---

## High-Velocity Bézier Curves (`Easing.bezier`)

For camera zooms, spatial whips, or background sweeps, specialized Bézier curves outperform springs:

```tsx
import { interpolate, Easing } from 'remotion';

// The Hypersonic Snap (Instant launch, silky deceleration)
const hyperEase = interpolate(frame, [0, 18], [0, 1], {
  easing: Easing.bezier(0.16, 1, 0.3, 1),
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
});

// The Anticipation Sling (Slight pull back before sudden thrust)
const slingEase = interpolate(frame, [0, 24], [0, 1], {
  easing: Easing.bezier(0.6, -0.28, 0.735, 0.045),
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
});
```

---

## Kinetic Typography Stagger Formulas

Never animate an entire paragraph as one block. Animate words or characters with tightly calibrated staggers:

```tsx
export const StaggeredWords: React.FC<{ text: string; startFrame?: number }> = ({
  text,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(' ');

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3em' }}>
      {words.map((word, i) => {
        // 2 frames delay per word creates high-velocity staccato rhythm
        const wordDelay = startFrame + i * 2;
        const progress = spring({
          frame: Math.max(0, frame - wordDelay),
          fps,
          config: { damping: 12, stiffness: 320, mass: 0.5 },
        });

        const translateY = interpolate(progress, [0, 1], [40, 0]);
        const opacity = interpolate(progress, [0, 0.8], [0, 1]);

        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              transform: `translateY(${translateY}px)`,
              opacity,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
```
