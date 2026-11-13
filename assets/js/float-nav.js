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
  function setShown(on) { fnav.classList.toggle('show', on); }

  function update() {
    if (jumping) {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(function () { jumping = false; anchorY = window.scrollY; }, 180);
      return;
    }
    if (!pastHeader()) { anchorY = null; setShown(false); return; }
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
    var y = labelOf(section).getBoundingClientRect().top + window.scrollY - OFFSET;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: Math.max(0, y), behavior: smooth && !reduce ? 'smooth' : 'auto' });
    return true;
  }

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
    var id = location.hash.slice(1);
    if (id && id !== 'top') scrollToSection(id, false);
  });
  update();
})();
