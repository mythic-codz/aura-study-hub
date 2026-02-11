// Multi-method DevTools detection engine

type DetectionCallback = () => void;

let isRunning = false;
let intervalId: number | null = null;

// Method 1: Window size difference detection
function checkWindowSize(): boolean {
  const threshold = 160;
  const widthDiff = window.outerWidth - window.innerWidth;
  const heightDiff = window.outerHeight - window.innerHeight;
  return widthDiff > threshold || heightDiff > threshold;
}

// Method 2: Debugger timing attack
function checkDebuggerTiming(): boolean {
  const start = performance.now();
  // eslint-disable-next-line no-debugger
  debugger;
  const end = performance.now();
  // If debugger is active, there will be a significant pause
  return (end - start) > 100;
}

// Method 3: Console detection via toString override
let consoleDetected = false;

function setupConsoleDetection() {
  const element = new Image();
  Object.defineProperty(element, 'id', {
    get: function () {
      consoleDetected = true;
      return 'devtools-detect';
    },
  });

  // Periodically log the object - if console is open, the getter fires
  setInterval(() => {
    consoleDetected = false;
    console.log('%c', element as any);
    console.clear();
  }, 2000);
}

// Method 4: Performance timing check
function checkPerformanceTiming(): boolean {
  const t0 = performance.now();
  for (let i = 0; i < 100; i++) {
    // Simple loop that should be near-instant
    Math.random();
  }
  const t1 = performance.now();
  // If DevTools profiler is active, this takes much longer
  return (t1 - t0) > 50;
}

// Combined detection
function isDevToolsOpen(): boolean {
  if (checkWindowSize()) return true;
  if (consoleDetected) return true;
  if (checkPerformanceTiming()) return true;
  return false;
}

export function startDetection(onDetected: DetectionCallback): void {
  if (isRunning) return;
  isRunning = true;

  setupConsoleDetection();

  intervalId = window.setInterval(() => {
    if (isDevToolsOpen()) {
      onDetected();
    }
  }, 1500);
}

export function stopDetection(): void {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  isRunning = false;
}

// One-time debugger check (used sparingly as it causes a visible pause)
export function runDebuggerCheck(onDetected: DetectionCallback): void {
  if (checkDebuggerTiming()) {
    onDetected();
  }
}
