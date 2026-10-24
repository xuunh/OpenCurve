/* Every reload starts from the very beginning: no jumping back to where you were, and no #section left in the address
   from a scroll link, so the loader and the whole intro play again */
try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; if (location.hash) history.replaceState(null, '', location.pathname + location.search); } catch (e) {}   /* some embedded previews don't allow touching the address */
window.scrollTo(0, 0);
window.addEventListener('load', function () { window.scrollTo(0, 0); });
/* Loader: the count eases toward 90 while things load, then runs to 100 once the 3D scene has drawn its first frame */
(function () {
  var el = document.getElementById('loader'), num = document.getElementById('ldNum'), curve = document.getElementById('ldCurve'), dot = document.getElementById('ldDot'), ticks = document.getElementById('ldTicks');
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  for (var i = 1; i <= 8; i++) { var x = i * 90; ticks.insertAdjacentHTML('beforeend', '<line class="tick" x1="' + x + '" y1="115" x2="' + x + '" y2="125"/>'); }
  var p = 0, ready = false, start = performance.now(), MIN = still ? 300 : 1400, gone = false;
  function hold(e) { if (!gone && (e.type !== 'keydown' || /^( |Page|Arrow|Home|End)/.test(e.key))) e.preventDefault(); }   /* no scrolling until the loader lifts, so the first screen is never skipped */
  window.addEventListener('wheel', hold, { passive: false }); window.addEventListener('touchmove', hold, { passive: false }); window.addEventListener('keydown', hold);
  function y(x) { return 120 - Math.sin(x / 720 * Math.PI * 4) * 84; }
  function draw(f) {
    var n = Math.max(2, Math.round(f * 160)), d = '';
    for (var k = 0; k <= n; k++) { var x = (k / 160) * 720; d += (k ? 'L' : 'M') + x.toFixed(1) + ' ' + y(x).toFixed(1); }
    curve.setAttribute('d', d);
    var xe = f * 720; dot.setAttribute('cx', xe.toFixed(1)); dot.setAttribute('cy', y(xe).toFixed(1));
    var v = String(Math.round(f * 100)); num.textContent = ('000' + v).slice(-3);
  }
  function finish() {
    if (gone) return; gone = true; window.ssLoaded = true;
    window.removeEventListener('wheel', hold); window.removeEventListener('touchmove', hold); window.removeEventListener('keydown', hold);
    if (window.scrollY) window.scrollTo(0, 0);
    el.classList.add('done');
    var pre = document.getElementById('prelude'); if (pre) pre.classList.add('on'); document.documentElement.classList.add('pre-ready');   /* the pre-cover line fades up as the loader lifts */
    el.setAttribute('aria-label', 'Loaded');
    setTimeout(function () { el.remove(); }, 1200);
  }
  window.ssReady = function () { ready = true; };
  var prev = performance.now();
  (function tick(now) {
    if (gone) return;
    now = now || performance.now();
    var dt = Math.min(100, now - prev) / 16.7; prev = now;   /* time-based, so slow devices don't load slower */
    var cap = ready && now - start > MIN ? 1 : 0.9;
    p += (cap - p) * (1 - Math.pow(1 - (cap === 1 ? 0.12 : 0.035), dt));
    if (cap === 1 && p > 0.998) { p = 1; draw(1); setTimeout(finish, still ? 0 : 280); return; }
    draw(p);
    requestAnimationFrame(tick);
  })();
  setTimeout(function () { ready = true; }, 7000);   /* never get stuck: give up waiting after 7s */
})();
