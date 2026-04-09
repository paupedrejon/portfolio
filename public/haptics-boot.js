/**
 * Native boot script (runs outside React): Web Vibration + flash.
 * Uses elementFromPoint so touches on stacked UI / canvas still resolve correctly.
 */
(function () {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return;
  }

  var THROTTLE_MS = 90;
  var lastAt = 0;

  var SEL =
    'button:not([disabled]):not([aria-disabled="true"]),' +
    'a[href],' +
    'input[type="submit"]:not([disabled]),' +
    'input[type="button"]:not([disabled]),' +
    'input[type="reset"]:not([disabled]),' +
    'input[type="checkbox"]:not([disabled]),' +
    'input[type="radio"]:not([disabled]),' +
    'summary,' +
    'label,' +
    '[role="button"]:not([aria-disabled="true"]),' +
    '[role="link"],' +
    '[data-haptic]';

  function vibrateOnce() {
    var now = Date.now();
    if (now - lastAt < THROTTLE_MS) return;
    lastAt = now;
    try {
      navigator.vibrate(60);
    } catch (e) {}
  }

  function flash(el) {
    if (!el || !el.classList) return;
    try {
      el.classList.remove('haptic-touch-flash', 'haptic-touch-flash-strong');
      void el.offsetWidth;
      el.classList.add('haptic-touch-flash-strong');
      window.setTimeout(function () {
        el.classList.remove('haptic-touch-flash-strong');
      }, 280);
    } catch (e) {}
  }

  function resolveElement(ev) {
    var t = ev.touches && ev.touches[0];
    var el = null;
    if (t && typeof document.elementFromPoint === 'function') {
      el = document.elementFromPoint(t.clientX, t.clientY);
    }
    if (!el && ev.target) {
      el = ev.target.nodeType === 3 ? ev.target.parentElement : ev.target;
    }
    if (!(el instanceof Element)) return null;
    if (el.closest && el.closest('[data-no-haptic]')) return null;
    var hit = el.closest(SEL);
    return hit || null;
  }

  function onTouchStart(ev) {
    if (!ev.isTrusted) return;
    if (!ev.touches || ev.touches.length !== 1) return;
    var hit = resolveElement(ev);
    if (!hit) return;
    vibrateOnce();
    flash(hit);
  }

  function onPointerDown(ev) {
    if (!ev.isTrusted || ev.button !== 0) return;
    if (ev.pointerType === 'touch') return;
    var el = ev.target && ev.target.nodeType === 3 ? ev.target.parentElement : ev.target;
    if (!(el instanceof Element)) return;
    if (el.closest && el.closest('[data-no-haptic]')) return;
    var hit = el.closest(SEL);
    if (!hit) return;
    vibrateOnce();
    flash(hit);
  }

  document.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
  document.addEventListener('pointerdown', onPointerDown, true);
})();
