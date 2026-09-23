interface AnimateOptions {
  fromLngLat: [number, number];
  toLngLat: [number, number];
  fromBearing: number;
  toBearing: number;
  durationMs?: number;
  onUpdate: (lngLat: [number, number], bearing: number) => void;
  onComplete?: () => void;
}

/**
 * Computes shortest angular distance between two degrees (-180 to +180).
 */
export function shortestAngleDiff(from: number, to: number): number {
  const diff = (to - from) % 360;
  return ((2 * diff) % 360) - diff;
}

/**
 * Smoothly tweens a marker position and bearing over durationMs using rAF.
 */
export function animateMarker({
  fromLngLat,
  toLngLat,
  fromBearing,
  toBearing,
  durationMs = 1500,
  onUpdate,
  onComplete,
}: AnimateOptions): () => void {
  // Check prefers-reduced-motion
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    onUpdate(toLngLat, toBearing);
    onComplete?.();
    return () => {};
  }

  let rafId: number;
  const startTime = performance.now();
  const angleDelta = shortestAngleDiff(fromBearing, toBearing);

  function frame(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / durationMs);

    // Ease-in-out cubic curve
    const ease =
      progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    const currentLng = fromLngLat[0] + (toLngLat[0] - fromLngLat[0]) * ease;
    const currentLat = fromLngLat[1] + (toLngLat[1] - fromLngLat[1]) * ease;
    const currentBearing = (fromBearing + angleDelta * ease + 360) % 360;

    onUpdate([currentLng, currentLat], currentBearing);

    if (progress < 1) {
      rafId = requestAnimationFrame(frame);
    } else {
      onComplete?.();
    }
  }

  rafId = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(rafId);
}

/**
 * Creates the DOM element for the train marker with locomotive icon and animated radar pulse ring.
 */
export function createTrainMarkerElement(): {
  container: HTMLDivElement;
  iconWrapper: HTMLDivElement;
} {
  const container = document.createElement("div");
  container.className = "railgaadi-train-marker";
  container.style.cssText = `
    position: relative;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: auto;
    cursor: pointer;
  `;

  // Outer pulse ring
  const pulse = document.createElement("div");
  pulse.className = "train-pulse-ring";
  pulse.style.cssText = `
    position: absolute;
    width: 48px;
    height: 48px;
    border-radius: 9999px;
    background: rgba(26, 111, 232, 0.25);
    border: 1.5px solid rgba(26, 111, 232, 0.6);
    animation: pulse-ring 2s ease-out infinite;
  `;
  container.appendChild(pulse);

  // Icon container that rotates to bearing
  const iconWrapper = document.createElement("div");
  iconWrapper.className = "train-icon-rotator";
  iconWrapper.style.cssText = `
    position: relative;
    width: 32px;
    height: 32px;
    border-radius: 9999px;
    background: #1A6FE8;
    border: 3px solid #FFFFFF;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 80ms linear;
  `;

  // Locomotive SVG
  iconWrapper.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="4" y="3" width="16" height="16" rx="2"/>
      <path d="M4 11h16"/>
      <path d="M12 3v8"/>
      <path d="m8 19-2 3"/>
      <path d="m18 22-2-3"/>
      <circle cx="8" cy="15" r="1" fill="#FFFFFF"/>
      <circle cx="16" cy="15" r="1" fill="#FFFFFF"/>
    </svg>
  `;

  container.appendChild(iconWrapper);
  return { container, iconWrapper };
}
