// Keyboard shortcut blocking, right-click disable, text selection disable

export function initSecurityGuard() {
  // Block keyboard shortcuts
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    // F12
    if (e.key === 'F12') {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+Shift+I (DevTools), Ctrl+Shift+J (Console), Ctrl+Shift+C (Inspector)
    if (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+U (View Source)
    if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+S (Save Page)
    if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+Shift+K (Firefox Console)
    if (e.ctrlKey && e.shiftKey && (e.key === 'K' || e.key === 'k')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Cmd+Option+I (Mac DevTools)
    if (e.metaKey && e.altKey && (e.key === 'i' || e.key === 'I')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Cmd+Option+J (Mac Console)
    if (e.metaKey && e.altKey && (e.key === 'j' || e.key === 'J')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Cmd+Option+U (Mac View Source)
    if (e.metaKey && e.altKey && (e.key === 'u' || e.key === 'U')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);

  // Block right-click context menu
  document.addEventListener('contextmenu', (e: MouseEvent) => {
    e.preventDefault();
    return false;
  }, true);

  // Block text selection via CSS
  document.body.style.userSelect = 'none';
  document.body.style.webkitUserSelect = 'none';
  (document.body.style as any).msUserSelect = 'none';

  // Block drag events on images and media
  document.addEventListener('dragstart', (e: DragEvent) => {
    e.preventDefault();
    return false;
  }, true);

  // Block copy
  document.addEventListener('copy', (e: ClipboardEvent) => {
    e.preventDefault();
    return false;
  }, true);

  // Block cut
  document.addEventListener('cut', (e: ClipboardEvent) => {
    e.preventDefault();
    return false;
  }, true);
}
