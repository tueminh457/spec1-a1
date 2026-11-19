// Page behaviour (not part of the artwork): today's date, reveal-on-scroll, "weave a new cloth" button.
(function () {
  // current date, formatted for the credits
  const t = document.getElementById('today');
  if (t) {
    const d = new Date();
    t.textContent = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    t.setAttribute('datetime', d.toISOString().slice(0, 10));
  }

  // each new visit paints a new cloth, so "weave" simply reloads the page
  const b = document.getElementById('reweave');
  if (b) { b.addEventListener('click', () => location.reload()); }

  // gentle fade-up for content blocks
  const items = document.querySelectorAll('.rv');
  if (!('IntersectionObserver' in window)) { items.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.12 });
  items.forEach(e => io.observe(e));

  const ridge = document.querySelector('.ridge');
  if (ridge) io.observe(ridge);
})();
