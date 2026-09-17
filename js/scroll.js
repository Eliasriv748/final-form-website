// js/scroll.js
const hero       = document.getElementById('hero');
const sidebar    = document.getElementById('sidebar');
const hills      = document.getElementById('hills-bleed');
const scrollHint = document.getElementById('scroll-hint');

const observer = new IntersectionObserver(
  ([entry]) => {
    if (entry.isIntersecting) {
      sidebar.classList.remove('sidebar-visible');
    } else {
      sidebar.classList.add('sidebar-visible');
    }
  },
  { threshold: 0.1 }
);
observer.observe(hero);

window.addEventListener('scroll', () => {
  const scrollY  = window.scrollY;
  const heroH    = hero.offsetHeight;
  const progress = Math.min(scrollY / heroH, 1);

  if (hills) hills.style.transform = `translateY(${scrollY * -0.25}px)`;
  if (scrollHint) scrollHint.style.opacity = Math.max(0, 1 - progress * 4);
}, { passive: true });
