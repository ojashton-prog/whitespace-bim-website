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
  var OFFSET = 23; // (the label this far from the top: 59 % closer than the 56 it was)
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
  // the section (up to 10.5 px) and settles back onto it. A touch or the wheel stops it.
  var glide = null;
  function stopGlide() { if (glide) { cancelAnimationFrame(glide); glide = null; } }
  function glideTo(y) {
    stopGlide();
    var from = window.scrollY, dist = y - from;
    if (Math.abs(dist) < 2) { window.scrollTo(0, y); return; }
    var reduce = false; // (the same glide everywhere, as asked; a phone's reduced-motion setting no longer skips it)
    // With inertia: speeds up to the middle of the move and slows again, a little past the section (up to 10.5 px), settles
    // back onto it. Reduced motion: a short plain glide.
    var dir = dist > 0 ? 1 : -1;
    var over = reduce ? 0 : dir * Math.min(10.5, Math.max(2.7, Math.abs(dist) * 0.00525));
    // (A mouse, i.e. a desktop: the whole move half as fast again: two thirds of the time.)
    var pace = window.matchMedia('(hover: hover) and (pointer: fine)').matches ? 1 / 1.5 : 1;
    var ms1 = (reduce ? 260 : Math.min(1000, 433 + Math.abs(dist) * 0.1667)) * pace;
    var ms2 = (reduce ? 0 : 320) * pace;
    var peak = from + dist + over;
    var t0 = null;
    document.documentElement.style.scrollBehavior = 'auto';
    function step(t) {
      if (t0 === null) t0 = t;
      var el = t - t0, pos, done = false;
      if (el < ms1) {
        var k = el / ms1;
        // Ease in (gathering speed), then a long soft deceleration into the overshoot.
        // Ramps up and down evenly: the fastest in the middle of the move, still at both ends.
        var e = 0.5 - Math.cos(Math.PI * k) / 2;
        pos = from + (peak - from) * e;
      } else if (el < ms1 + ms2) {
        var b = (el - ms1) / ms2;
        pos = peak + (from + dist - peak) * (0.5 - Math.cos(Math.PI * b) / 2);
      } else { pos = from + dist; done = true; }
      window.scrollTo(0, pos);
      if (!done) glide = requestAnimationFrame(step);
      else { glide = null; document.documentElement.style.scrollBehavior = ''; clearTimeout(settleTimer); settleTimer = setTimeout(function () { jumping = false; anchorY = window.scrollY; }, 250); }
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
  var lastW = 0, lastH = 0, lastInner = 0, tallest = 0;
  function fitSections(force) {
    // Section spacing uses the tallest the screen has been at this width (phones: bars hidden).
    if (window.innerWidth !== lastW) tallest = 0;
    tallest = Math.max(tallest, window.innerHeight);
    var vh = Math.max(probe.offsetHeight || 0, tallest);
    // Re-fit whenever the visible height changes too (phone browser bars showing or hiding).
    if (!force && window.innerWidth === lastW && Math.abs(vh - lastH) < 2 && Math.abs(window.innerHeight - lastInner) < 2) return;
    lastW = window.innerWidth; lastH = vh; lastInner = window.innerHeight;
    IDS.forEach(function (id) { var el = document.getElementById(id); if (el) el.style.paddingTop = base[id] + 'px'; });
    // Extra room goes above a section's divider line, so the line stays close to its heading.
    function spacerOf(sec) {
      var d = sec.previousElementSibling;
      return d && (d.getAttribute('aria-hidden') === 'true' || d.id === 'rule') ? d : sec;
    }
    IDS.forEach(function (id) {
      var sec = document.getElementById(id); if (!sec) return;
      var sp = spacerOf(sec); if (sp === sec) return;
      if (sp.dataset.basePad === undefined) sp.dataset.basePad = parseFloat(getComputedStyle(sp).paddingTop) || 0;
      sp.style.paddingTop = sp.dataset.basePad + 'px';
    });
    for (var i = 1; i < IDS.length; i++) {
      var prev = document.getElementById(IDS[i - 1]), next = document.getElementById(IDS[i]);
      if (!prev || !next) continue;
      var gap = labelOf(next).getBoundingClientRect().top - labelOf(prev).getBoundingClientRect().top;
      var need = vh - OFFSET + 24;
      if (gap < need) {
        var sp = spacerOf(next);
        if (sp === next) next.style.paddingTop = (base[IDS[i]] + need - gap) + 'px';
        else sp.style.paddingTop = (parseFloat(sp.dataset.basePad) + need - gap) + 'px';
      }
    }
    // Make sure the page is long enough for the last section to reach the same spot.
    // The spare room goes into the message box first, so the logo ends at the bottom
    // of the screen; anything beyond a sensible box size goes below the footer.
    var last = document.getElementById(IDS[IDS.length - 1]);
    var foot = document.querySelector('footer');
    var box = last && last.querySelector('textarea');
    if (last && foot) {
      foot.style.marginBottom = '';
      if (box) box.style.removeProperty('height');
      foot.style.removeProperty('padding-top');
      var target = labelOf(last).getBoundingClientRect().top + window.scrollY - OFFSET;
      // Fit the visible screen as it is now; this re-runs when phone browser bars show or hide,
      // so the logo always ends just above the bottom of what you can see.
      var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      var extra = target - maxScroll;
      // First a little more room between the Send button and the logo, then a taller message box.
      if (extra > 0) {
        var gap = Math.min(extra, 32);
        foot.style.setProperty('padding-top', (parseFloat(getComputedStyle(foot).paddingTop) + gap) + 'px', 'important');
        extra -= gap;
      }
      if (extra > 0 && box) {
        var grow = Math.min(extra, 280);
        box.style.setProperty('height', (box.getBoundingClientRect().height + grow) + 'px', 'important');
        extra -= grow;
      }
      if (extra > 0) foot.style.marginBottom = (extra + 2) + 'px';
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
    // The pill goes at once (no fade lingering over the section being landed on), and stays
    // away until the glide has finished and the page is scrolled again.
    fnav.classList.add('instant');
    setShown(false);
    void fnav.offsetWidth;
    requestAnimationFrame(function () { requestAnimationFrame(function () { fnav.classList.remove('instant'); }); });
    jumping = true;
    anchorY = null;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(function () { if (!glide) { jumping = false; anchorY = window.scrollY; } }, 900);
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
