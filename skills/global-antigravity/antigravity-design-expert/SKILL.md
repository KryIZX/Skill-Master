---
name: antigravity-design-expert
description: Guidelines and patterns for elite cinematic UI/UX, technical brutalism styling, micro-animations, and visual polish on the web.
---

# Elite Cinematic UI/UX & Technical Brutalism Guidelines

This skill provides design instructions to transform basic layouts into premium, cinematic, high-contrast, and highly technical promotional websites.

## Core Design Directives

### 1. Advanced Typography & Legibility Tuning
- Use `text-wrap: balance` on short headings (under 3 lines) to prevent typographic orphans.
- Use `text-wrap: pretty` on paragraph text to ensure optimal line-breaks and readability.
- Style micro-text labels with `letter-spacing: 0.15em` to 0.25em, uppercase only, and thin weights to emphasize the "data feed" feel.

### 2. High-Tech Overlays & Accents
- **Grid Systems:** Implement subtle `1px` borders using semi-transparent variables (`rgba(255, 255, 255, 0.05)`).
- **Corner Marks:** Add absolute-positioned corners `[ + ]` or custom boundary lines to cards and sections.
- **Scanlines and Noise:** A fixed-position, low-opacity (4%) SVG noise overlay or a scanline linear-gradient backdrop that moves with custom animations.
- **Interactive Cursor Spotlight:** A pointer-tracking radial gradient that highlights elements as the user moves their mouse.

### 3. Dynamic Interactive States
- **Glitch Hover:** Text elements should have subtle translation glitch animations on hover using CSS clip-path keyframes.
- **Magnetic Buttons:** Apply subtle GSAP-driven magnet hover effects on core actionable links.
- **Glassmorphism:** Navigation bars and sticky overlays should use `backdrop-filter: blur(20px)` combined with a subtle inner border for a premium floating pane look.

### 4. Video Captions & Kinetic Typography (STRICT RULE)
- **NO BOXES / NO BORDERS / NO PILLS EVER**: Never wrap individual caption words or subtitle phrases in rectangular boxes, borders, solid backgrounds, or pill containers. Boxes look cluttered, amateur, and visually jarring.
- **Pure Typography Only**: Captions must float freely as clean, pure typography over the video composition.
- **Editorial Serif Headlines**: Use high-contrast, elegant editorial serif typography (such as `Playfair Display`, `Instrument Serif`, or `Cormorant Garamond`) for sophisticated, luxurious caption presence.
- **Legibility Through Text Contrast**: Achieve contrast and legibility purely through layered text shadows (e.g. `textShadow: '0 2px 14px rgba(0,0,0,0.95), 0 4px 28px rgba(0,0,0,0.8)'`), NEVER with background rectangles.
- **Keyword Accents**: Emphasize high-leverage words through color change (e.g., cyber cyan `#00F0FF`) and subtle italics, NEVER with background chips or borders.
