// Floating section nav: slides in at the top right once the header has scrolled away.
// Clicking a link hides it while the page scrolls to the section; scrolling a little
// afterwards brings it back.
(function () {
  var header = document.querySelector('header');
  var nav = header && header.querySelector('nav');
  if (!nav) return;

  var fnav = nav.cloneNode(true);
  fnav.removeAttribute('style');
  fnav.className = 'fnav';
  fnav.setAttribute('aria-label', 'Sections');
  document.body.appendChild(fnav);

  var REVEAL = 60;          // px of scrolling after a jump before the nav returns
  var jumping = false;      // true while a link-triggered scroll is in progress
  var anchorY = null;       // scroll position where the jump landed
  var settleTimer;

  function pastHeader() { return nav.getBoundingClientRect().bottom < 0; }
  // Shown: slides in. Hides 1.5s after the last scroll or touch: slides out if a finger
  // is still on the screen, fades out in place if not. Back at the top of the page it
  // slides out. Stays while the mouse is over it or a link in it has keyboard focus.
  var HIDE_AFTER = 1500;
  var hideTimer, hovering = false, touching = false;
  function isShown() { return fnav.classList.contains('show'); }
  function armHide() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () {
      if (hovering || fnav.contains(document.activeElement)) { armHide(); return; }
      setShown(false, touching);
      anchorY = window.scrollY;   // scroll a little again to bring it back
    }, HIDE_AFTER);
  }
  function setShown(on, slideOut) {
    fnav.classList.toggle('slideout', !on && !!slideOut);
    fnav.classList.toggle('show', on);
    if (on) armHide(); else clearTimeout(hideTimer);
  }
  fnav.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'mouse') return; hovering = true; clearTimeout(hideTimer); });
  fnav.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'mouse') return; hovering = false; if (isShown()) armHide(); });
  fnav.addEventListener('focusout', function () { if (isShown()) armHide(); });

  // Touching the screen brings the pill in.
  window.addEventListener('touchstart', function (e) {
    touching = true;
    dirAcc = 0; lastY = window.scrollY;
    if (jumping || fnav.contains(e.target)) return;
    if (pastHeader()) { anchorY = null; setShown(true); }
  }, { passive: true });
  function release() { touching = false; if (isShown()) armHide(); }
  window.addEventListener('touchend', release, { passive: true });
  window.addEventListener('touchcancel', release, { passive: true });

  var lastY = window.scrollY, dirAcc = 0, DIR_STEP = 12;
  function update() {
    if (jumping) {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(function () { jumping = false; anchorY = window.scrollY; }, 180);
      return;
    }
    if (!pastHeader()) { anchorY = null; if (isShown()) setShown(false, true); return; }
    // Finger on the screen: follow the direction of travel. Moving down the page
    // slides it in, moving back up the page slides it out.
    var y = window.scrollY, dy = y - lastY;
    lastY = y;
    if (touching) {
      if ((dy > 0 && dirAcc < 0) || (dy < 0 && dirAcc > 0)) dirAcc = 0;
      dirAcc += dy;
      if (dirAcc < -DIR_STEP && isShown()) { setShown(false, true); anchorY = null; }
      else if (dirAcc > DIR_STEP && !isShown()) { anchorY = null; setShown(true); }
      else if (isShown()) armHide();
      return;
    }
    if (isShown()) { armHide(); return; }
    if (anchorY !== null && Math.abs(window.scrollY - anchorY) < REVEAL) return;
    anchorY = null;
    setShown(true);
  }

  // Land every section with its small label the same distance from the top of the screen.
  var OFFSET = 56;
  function labelOf(section) {
    var bar = section.querySelector('span > span[aria-hidden="true"]');
    return bar ? bar.parentElement : section;
  }
  function scrollToSection(id, smooth) {
    var section = document.getElementById(id);
    if (!section) return false;
    var y = Math.max(0, labelOf(section).getBoundingClientRect().top + window.scrollY - OFFSET);
    if (smooth) glideTo(y); else window.scrollTo(0, y);
    return true;
  }

  // Our own smooth scroll, the same on every phone and browser (some phones skip the
  // browser's own when animations are turned down): it gathers speed, coasts a little past
  // the section and settles back onto it. A touch or the wheel stops it.
  var glide = null;
  function stopGlide() { if (glide) { cancelAnimationFrame(glide); glide = null; } }
  function glideTo(y) {
    stopGlide();
    var from = window.scrollY, dist = y - from;
    if (Math.abs(dist) < 2) { window.scrollTo(0, y); return; }
    var reduce = false; // (the same glide everywhere, as asked; a phone's reduced-motion setting no longer skips it)
    // With inertia: picks up speed, coasts a little past the section (up to 70 px), settles
    // back onto it. Reduced motion: a short plain glide.
    var dir = dist > 0 ? 1 : -1;
    var over = reduce ? 0 : dir * Math.min(70, Math.max(18, Math.abs(dist) * 0.035));
    var ms1 = reduce ? 260 : Math.min(1500, 650 + Math.abs(dist) * 0.25);
    var ms2 = reduce ? 0 : 480;
    var peak = from + dist + over;
    var t0 = null;
    document.documentElement.style.scrollBehavior = 'auto';
    function step(t) {
      if (t0 === null) t0 = t;
      var el = t - t0, pos, done = false;
      if (el < ms1) {
        var k = el / ms1;
        // Ease in (gathering speed), then a long soft deceleration into the overshoot.
        // (k^2 to 35 %, then 1 - B (1-k)^2.4: position and speed continuous; speed 0 at the peak)
        var e = k < 0.35 ? 3.2043 * k * k : 1 - 1.7083 * Math.pow(1 - k, 2.4);
        pos = from + (peak - from) * e;
      } else if (el < ms1 + ms2) {
        var b = (el - ms1) / ms2;
        pos = peak + (from + dist - peak) * (0.5 - Math.cos(Math.PI * b) / 2);
      } else { pos = from + dist; done = true; }
      window.scrollTo(0, pos);
      if (!done) glide = requestAnimationFrame(step);
      else { glide = null; document.documentElement.style.scrollBehavior = ''; }
    }
    glide = requestAnimationFrame(step);
  }
  window.addEventListener('wheel', stopGlide, { passive: true });
  window.addEventListener('touchstart', stopGlide, { passive: true });

  // Space the sections so that, once a section is landed on, the next one starts
  // below the bottom of the screen. Extra room is added above the next section's title.
  var IDS = ['services', 'work', 'about', 'contact'];
  var probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;top:0;left:0;width:0;visibility:hidden;pointer-events:none;height:100vh;height:100lvh';
  document.body.appendChild(probe);
  var base = {};
  IDS.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) base[id] = parseFloat(getComputedStyle(el).paddingTop) || 0;
  });
  var lastW = 0, lastH = 0;
  function fitSections(force) {
    var vh = probe.offsetHeight || window.innerHeight;
    if (!force && window.innerWidth === lastW && Math.abs(vh - lastH) < 2) return;
    lastW = window.innerWidth; lastH = vh;
    IDS.forEach(function (id) { var el = document.getElementById(id); if (el) el.style.paddingTop = base[id] + 'px'; });
    for (var i = 1; i < IDS.length; i++) {
      var prev = document.getElementById(IDS[i - 1]), next = document.getElementById(IDS[i]);
      if (!prev || !next) continue;
      var gap = labelOf(next).getBoundingClientRect().top - labelOf(prev).getBoundingClientRect().top;
      var need = vh - OFFSET + 24;
      if (gap < need) next.style.paddingTop = (base[IDS[i]] + need - gap) + 'px';
    }
    // Make sure the page is long enough for the last section to reach the same spot.
    var last = document.getElementById(IDS[IDS.length - 1]);
    if (last) {
      last.style.paddingBottom = '';
      var target = labelOf(last).getBoundingClientRect().top + window.scrollY - OFFSET;
      var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (target > maxScroll) last.style.paddingBottom = (target - maxScroll + 2) + 'px';
    }
  }
  fitSections(true);
  window.addEventListener('resize', function () { fitSections(false); });

  function onLink(e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    if (id !== 'top' && document.getElementById(id)) {
      e.preventDefault();
      history.replaceState(null, '', '#' + id);
      scrollToSection(id, true);
    }
    setShown(false);
    jumping = true;
    anchorY = null;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(function () { jumping = false; anchorY = window.scrollY; }, 900);
    if (a.parentNode === fnav) a.blur();
  }

  nav.addEventListener('click', onLink);
  fnav.addEventListener('click', onLink);
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('load', function () {
    fitSections(true);
    var id = location.hash.slice(1);
    if (id && id !== 'top') scrollToSection(id, false);
  });
  update();
})();
