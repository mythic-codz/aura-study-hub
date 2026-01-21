// Generate a unique device ID using browser fingerprinting
export function generateDeviceId(): string {
  const nav = window.navigator;
  const screen = window.screen;
  
  const data = [
    nav.userAgent,
    nav.language,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    nav.hardwareConcurrency || 'unknown',
    (nav as any).deviceMemory || 'unknown',
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Convert to base36 and add timestamp for uniqueness
  const timestamp = Date.now().toString(36);
  const hashStr = Math.abs(hash).toString(36);
  
  return `${hashStr}-${timestamp}`;
}

export function getStoredDeviceId(): string | null {
  return localStorage.getItem('aura_device_id');
}

// Alias for getStoredDeviceId
export function getDeviceId(): string | null {
  return getStoredDeviceId();
}

export function storeDeviceId(deviceId: string): void {
  localStorage.setItem('aura_device_id', deviceId);
}

export function getOrCreateDeviceId(): string {
  let deviceId = getStoredDeviceId();
  if (!deviceId) {
    deviceId = generateDeviceId();
    storeDeviceId(deviceId);
  }
  return deviceId;
}
