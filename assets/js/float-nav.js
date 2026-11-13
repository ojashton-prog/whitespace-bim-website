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

  function onLink(e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
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
  update();
})();
