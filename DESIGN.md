# DESIGN.md — RailGaadi Visual System

Version 1.0 · Read alongside `PRD.md`. Single source of truth for colours, typography, spacing, motion, and component patterns. All tokens map to CSS custom properties in `app/globals.css`.

---

## 1. Design Philosophy

**Apple Maps meets Indian Railways.** Clean, airy white surfaces. The map is the product; everything else is a calm overlay. Motion is purposeful — never decorative for its own sake. Status is always conveyed by both colour *and* icon/text.

**Three laws:**
1. The map always shows through.
2. Information density is earned — show minimum, reveal on tap.
3. White space is breathing room, not waste.

---

## 2. Colour Tokens

```css
:root {
  /* Brand */
  --color-brand:        #1A6FE8;
  --color-brand-light:  #EBF2FF;
  --color-brand-dark:   #1358B8;

  /* Status */
  --color-on-time:      #16A34A;
  --color-on-time-bg:   #F0FDF4;
  --color-delayed:      #D97706;
  --color-delayed-bg:   #FFFBEB;
  --color-late:         #DC2626;
  --color-late-bg:      #FEF2F2;
  --color-cancelled:    #6B7280;
  --color-cancelled-bg: #F9FAFB;

  /* Station plaque — Indian station board */
  --color-plaque-bg:    #FBBF24;
  --color-plaque-text:  #1C1917;
  --color-plaque-sub:   #78350F;

  /* Surfaces */
  --color-surface-0:    #FFFFFF;
  --color-surface-1:    #F8FAFC;
  --color-surface-2:    #F1F5F9;
  --color-surface-3:    #E2E8F0;

  /* Text */
  --color-text-primary:   #0F172A;
  --color-text-secondary: #475569;
  --color-text-tertiary:  #94A3B8;
  --color-text-inverse:   #FFFFFF;

  /* Map */
  --color-route-completed: #1A6FE8;
  --color-route-remaining: #CBD5E1;
  --color-route-glow:      rgba(26, 111, 232, 0.35);
  --color-station-dot:     #FFFFFF;
  --color-station-border:  #1A6FE8;
  --color-current-station: #FBBF24;

  /* Discovery types */
  --color-water:     #0EA5E9;
  --color-hill:      #65A30D;
  --color-bridge:    #F59E0B;
  --color-tunnel:    #8B5CF6;
  --color-landmark:  #EC4899;
  --color-city:      #64748B;

  /* Semantic aliases */
  --bg:           var(--color-surface-0);
  --bg-card:      var(--color-surface-1);
  --bg-input:     var(--color-surface-2);
  --border:       var(--color-surface-3);
  --text:         var(--color-text-primary);
  --text-muted:   var(--color-text-secondary);
  --text-hint:    var(--color-text-tertiary);
  --accent:       var(--color-brand);
  --accent-light: var(--color-brand-light);
}
```

---

## 3. Typography

**Font:** Inter (Google Fonts, variable). Fallback: `system-ui, -apple-system, sans-serif`.

| Token | Size | Weight | Usage |
|---|---|---|---|
| `--text-2xs` | 10px | 500 | Timestamps, meta |
| `--text-xs`  | 12px | 400–500 | Chips, labels |
| `--text-sm`  | 14px | 400 | Body, list items |
| `--text-base`| 16px | 400 | Default body |
| `--text-lg`  | 18px | 600 | Section titles |
| `--text-xl`  | 20px | 700 | Card headings |
| `--text-2xl` | 24px | 700 | Station plaque name |
| `--text-3xl` | 30px | 800 | Hero countdown |
| `--text-4xl` | 36px | 900 | Completion % |

Special: `.font-tabular` → `font-variant-numeric: tabular-nums` (numbers, times, delays).

---

## 4. Spacing & Layout

8px base unit. All spacing in multiples of 4px or 8px.

```css
--space-1: 4px;   --space-2: 8px;   --space-3: 12px;
--space-4: 16px;  --space-5: 20px;  --space-6: 24px;
--space-8: 32px;  --space-10: 40px; --space-12: 48px;

--radius-sm:  6px;  --radius-md: 10px;  --radius-lg: 16px;
--radius-xl:  24px; --radius-full: 9999px;

--shadow-xs: 0 1px 2px rgba(0,0,0,0.04);
--shadow-sm: 0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
--shadow-md: 0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
--shadow-lg: 0 8px 32px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.06);
--shadow-panel: 0 0 0 1px var(--border), 0 8px 32px rgba(0,0,0,0.08);
```

**Breakpoints:**
| Range | Layout |
|---|---|
| < 768 px | Full-screen map + bottom sheet |
| 768–1023 px | Collapsible side panel (360 px) |
| ≥ 1024 px | Fixed side panel (400 px) + map |

---

## 5. Component Patterns

### 5.1 Station Plaque (Signature Element)

The hero status element. Inspired by the iconic yellow Indian station name boards.

```
background: var(--color-plaque-bg)   /* #FBBF24 yellow */
border: 4px solid #92400E
border-radius: var(--radius-md)
box-shadow: inset 0 1px 0 rgba(255,255,255,0.3), var(--shadow-md)
padding: var(--space-4) var(--space-6)
text-align: center
```

Internal layout (top to bottom):
1. "भारतीय रेल" — text-xs, plaque-sub, weight 700
2. Station name in ALLCAPS — text-2xl, weight 900, letter-spacing -0.02em
3. Station code — text-sm, plaque-sub, letter-spacing 0.15em
4. Divider rule — 1px, plaque-sub at 30% opacity
5. "Next: STATION · N min" — text-sm, plaque-sub

Entry: slides up 12px + fade-in, 400ms `cubic-bezier(0.34, 1.56, 0.64, 1)`.

### 5.2 Status Chip

Always icon + text label (never colour-only).

| Status | BG | Text | Icon |
|---|---|---|---|
| On time | `--color-on-time-bg` | `--color-on-time` | CheckCircle2 |
| Delayed | `--color-delayed-bg` | `--color-delayed` | Clock + "+N min" |
| Severely late | `--color-late-bg` | `--color-late` | AlertTriangle |
| Not started | `--color-surface-2` | `--text-muted` | Clock |
| Reached | `--color-on-time-bg` | `--color-on-time` | CheckCircle2 |
| Cancelled | `--color-cancelled-bg` | `--color-cancelled` | XCircle |

Shape: `border-radius: var(--radius-full)`, padding `4px 10px`, font-size `--text-xs`, weight 600.

### 5.3 Progress Rail

```
Height: 8px; border-radius: full
Background: var(--color-route-remaining)
Fill: linear-gradient(90deg, var(--color-brand-dark), var(--color-brand))
Fill transition: width 1s cubic-bezier(0.4, 0, 0.2, 1) on mount
Station ticks: white 2px × 12px at each halt's km position
Current station tick: 16px, var(--color-plaque-bg)
```

### 5.4 Bottom Sheet (Mobile)

Three snap points: **peek** (120px), **half** (~50vh), **full** (full screen).

```
border-radius: 20px 20px 0 0
background: var(--bg)
box-shadow: 0 -4px 32px rgba(0,0,0,0.12)
Handle: 40px × 4px, var(--border), centered at top
```

Spring physics on release: tension 280, friction 60. Velocity > 300px/s → snap to next.

### 5.5 Search Combobox

```
height: 56px
background: var(--bg)
border: 1.5px solid var(--border)
border-radius: var(--radius-xl)
box-shadow: var(--shadow-md)
:focus-within → border-color: var(--accent)
               box-shadow: var(--shadow-lg), 0 0 0 3px var(--accent-light)
```

Suggestion row: 48px, hover `var(--bg-card)`. Matched text: `<mark>` with `background: var(--accent-light); color: var(--accent)`.

### 5.6 Cards, Buttons, Skeleton

**Card:** `background: var(--bg-card)`, `border: 1px solid var(--border)`, `border-radius: var(--radius-lg)`, `box-shadow: var(--shadow-sm)`.

**Button primary:** `background: var(--accent)`, white text, `:active → transform: scale(0.97)`.

**Ghost button:** transparent, `border: 1px solid var(--border)`.

**Skeleton:** `background: var(--bg-input)`, pulse animation `opacity 0.4→1→0.4`, 1.5s infinite.

### 5.7 Toast

```
position: fixed; bottom-right desktop / bottom-center mobile
background: var(--color-text-primary); color: white
border-radius: var(--radius-lg); padding: 12px 16px
box-shadow: var(--shadow-lg)
entry: slide up 16px + fade, 250ms ease-out
auto-dismiss: 3s
```

---

## 6. Map Visual Spec

**Style URL:** `https://api.maptiler.com/maps/streets-v2/style.json?key=NEXT_PUBLIC_MAPTILER_KEY`

### 6.1 Route Layers

```
"route-remaining": line, color "#CBD5E1", width 2→4 by zoom, dasharray [4,3]
"route-glow":      line, color "rgba(26,111,232,0.35)", width 8→16, blur 6
"route-completed": line, color "#1A6FE8", width 3→5, cap/join "round"
```

Route draw animation: `line-dasharray` from `[0, length]` → `[length, 0]` over 1200ms. Skip on `prefers-reduced-motion`.

### 6.2 Station Markers

```
Non-halt: 6px circle, fill white, stroke 1.5px brand (zoom ≥ 8)
Halt:     10px circle, fill white, stroke 2px brand, label zoom ≥ 6
Current:  14px circle, fill var(--color-plaque-bg), pulsing ring animation
```

### 6.3 Train Marker

Custom SVG 32×32px. Brand blue fill. 3px white ring for contrast. Rotation = `turf.bearing` between prev/next. Tween over 1500ms along route (not straight line). Jump on `prefers-reduced-motion`.

### 6.4 Map Controls

```
position: fixed; right: 16px; top: 50% (desktop) / top: 16px (mobile)
background: var(--bg); border: 1px solid var(--border)
border-radius: var(--radius-lg); backdrop-filter: blur(8px)
buttons: stacked, 44×44px, separated by 1px divider
icons: Lucide (ZoomIn, ZoomOut, Compass, Layers, Navigation, Maximize2)
active: icon colour → var(--accent)
```

---

## 7. Motion System

```css
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-out:      cubic-bezier(0, 0, 0.2, 1);

--dur-instant: 80ms;
--dur-fast:    150ms;
--dur-normal:  250ms;
--dur-slow:    400ms;
--dur-scene:   900ms;
--dur-marker:  1500ms;
```

**Journey load sequence:**
1. 0ms — Skeleton map + panel
2. 300ms — Map tiles, camera eases to route bbox (900ms)
3. 900ms — Route lines draw in
4. 1200ms — Station dots fade in (20ms stagger each)
5. 1500ms — Train marker drops (scale 0→1, 300ms spring)
6. 1800ms — Station plaque slides up in panel

**Micro-interactions:**
- Status change: 300ms crossfade + 200ms highlight pulse
- Delay number: count-up 600ms (only on change ≥ 2 min)
- Tab switch: 200ms horizontal slide (fade on reduced-motion)
- Favourite: star scales 0.7→1.2→1.0 over 300ms
- Share copy: button morphs to checkmark, reverts after 2s

All animations in `@media (prefers-reduced-motion: no-preference)`.

---

## 8. Icons

**Set:** Lucide React (tree-shaken). Default 20px, stroke 1.5px. All decorative icons: `aria-hidden="true"`.

Key mappings: Train, CheckCircle2, Clock, AlertTriangle, XCircle, MapPin, Navigation2, CloudRain, Sun, Waves, Mountain, Landmark, Building2, Share2, Star, RefreshCw, ZoomIn, ZoomOut, Compass, Layers, Navigation.

---

## 9. Empty & Error States

| State | Headline | Body |
|---|---|---|
| No search results | "No trains found" | "Try the 5-digit train number, e.g. 12951" |
| Search error | "Couldn't search right now" | "Check your connection and try again." |
| No live data | "Live tracking not started" | "Check back closer to departure time." |
| Map WebGL fail | "Map unavailable" | "See the Stops tab for station info." |
| Weather error | "Weather unavailable" | — (silent, don't block UI) |

Illustrations: monochrome line-art SVGs, max 120×120px, 1.5px stroke weight.

---

## 10. Accessibility Checklist

- Focus ring: `outline: 2px solid var(--accent); outline-offset: 2px` everywhere.
- Contrast: minimum 4.5:1 text, 3:1 UI elements. All status colour pairs verified.
- Touch targets: minimum 44×44px (use padding, not just icon size).
- `aria-live="polite"` for delay/station change announcements.
- Map canvas: `aria-label="Journey map for [train name]"`, `role="img"`.
- Charts: visually hidden data table `<caption>` for screen readers.
- All status conveyed by icon + text, never colour alone.
