// js/product.js
import { addItem } from './cart.js';

const PRODUCTS = {
  'ff-001': {
    id: 'ff-001',
    name: 'The Final Ringer',
    price: 45,
    images: ['final-ringer-1.webp', 'final-ringer-2.webp', 'final-ringer-3.webp'],
    description: [
      'Classic muscle fit',
      '100% cotton jersey',
      'Optic white colorway',
      'Final Form logo front print',
    ],
  },
};

const product = PRODUCTS['ff-001'];
let currentIdx = 0;
let wheelLocked = false;

function render() {
  const n = product.images.length;
  const prevIdx = ((currentIdx - 1) % n + n) % n;
  const nextIdx = (currentIdx + 1) % n;

  const slides = [
    { src: product.images[prevIdx], cls: 'dist-1', idx: prevIdx },
    { src: product.images[currentIdx], cls: 'active', idx: currentIdx },
    { src: product.images[nextIdx], cls: 'dist-1', idx: nextIdx },
  ];

  const container = document.getElementById('product-images');
  if (!container) return;

  container.innerHTML = slides.map(s => `
    <div class="carousel-slide ${s.cls}" data-idx="${s.idx}">
      <img src="${s.src}" alt="${product.name} image ${s.idx + 1}">
    </div>`).join('');

  container.querySelectorAll('.carousel-slide:not(.active)').forEach(slide => {
    slide.addEventListener('click', () => goTo(parseInt(slide.dataset.idx)));
  });
}

function goTo(idx) {
  const n = product.images.length;
  currentIdx = ((idx % n) + n) % n;
  render();
}

document.addEventListener('DOMContentLoaded', () => {
  render();

  document.getElementById('carousel-prev')?.addEventListener('click', () => goTo(currentIdx - 1));
  document.getElementById('carousel-next')?.addEventListener('click', () => goTo(currentIdx + 1));

  document.getElementById('product-images')?.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (wheelLocked) return;
    wheelLocked = true;
    goTo(e.deltaY > 0 ? currentIdx + 1 : currentIdx - 1);
    setTimeout(() => { wheelLocked = false; }, 450);
  }, { passive: false });

  // Size selector
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  // Add to cart
  document.getElementById('add-to-cart')?.addEventListener('click', () => {
    const size = document.querySelector('.size-btn.selected')?.textContent?.trim() || 'M';
    addItem(product.id, product.name, size, product.price, product.images[0]);
    openCartIfAvailable();
  });

  document.getElementById('buy-now')?.addEventListener('click', () => {
    const size = document.querySelector('.size-btn.selected')?.textContent?.trim() || 'M';
    addItem(product.id, product.name, size, product.price, product.images[0]);
    openCartIfAvailable();
  });
});

function openCartIfAvailable() {
  const backdrop = document.getElementById('cart-backdrop');
  const modal = document.getElementById('cart-modal');
  if (backdrop && modal) {
    backdrop.removeAttribute('hidden');
    modal.removeAttribute('hidden');
  }
}
