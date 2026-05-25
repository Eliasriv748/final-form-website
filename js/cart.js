// js/cart.js
const CART_KEY = 'ff-cart';

export function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function addItem(id, name, size, price, imgSrc) {
  const cart = getCart();
  const existing = cart.find(i => i.id === id && i.size === size);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, name, size, price, imgSrc, qty: 1 });
  }
  saveCart(cart);
  renderCartGrid();
  updateCartBadge();
}

export function updateItemQty(id, size, delta) {
  const cart = getCart();
  const idx = cart.findIndex(i => i.id === id && i.size === size);
  if (idx === -1) return;
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  saveCart(cart);
  renderCartGrid();
  updateCartBadge();
}

export function clearCart() {
  saveCart([]);
  renderCartGrid();
  updateCartBadge();
}

export function getTotalQty() {
  return getCart().reduce((s, i) => s + i.qty, 0);
}

export function getSubtotal() {
  return getCart().reduce((s, i) => s + i.price * i.qty, 0).toFixed(2);
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  const qty = getTotalQty();
  badge.textContent = qty ? `(${qty})` : '';
}

export function renderCartGrid() {
  const grid = document.getElementById('cart-grid');
  const subtotalEl = document.getElementById('cart-subtotal-amount');
  if (!grid) return;

  const cart = getCart();
  const SLOTS = 15;
  grid.innerHTML = '';

  for (let i = 0; i < SLOTS; i++) {
    const item = cart[i];
    const slot = document.createElement('div');
    slot.className = 'cart-slot' + (item ? ' slot-filled' : '');

    if (item) {
      slot.innerHTML = `
        <img class="slot-thumb" src="${item.imgSrc}" alt="${item.name}">
        <span class="slot-qty">${item.size} ×${item.qty}</span>
        <div class="slot-controls">
          <button class="slot-dec" data-id="${item.id}" data-size="${item.size}">−</button>
          <span class="slot-qty-label">${item.qty}</span>
          <button class="slot-inc" data-id="${item.id}" data-size="${item.size}">+</button>
        </div>`;
    }
    grid.appendChild(slot);
  }

  grid.querySelectorAll('.slot-dec').forEach(btn => {
    btn.addEventListener('click', () => updateItemQty(btn.dataset.id, btn.dataset.size, -1));
  });
  grid.querySelectorAll('.slot-inc').forEach(btn => {
    btn.addEventListener('click', () => updateItemQty(btn.dataset.id, btn.dataset.size, 1));
  });

  if (subtotalEl) subtotalEl.textContent = `$${getSubtotal()}`;
}

export function openCart() {
  document.getElementById('cart-backdrop')?.removeAttribute('hidden');
  document.getElementById('cart-modal')?.removeAttribute('hidden');
  renderCartGrid();
}

export function closeCart() {
  document.getElementById('cart-backdrop')?.setAttribute('hidden', '');
  document.getElementById('cart-modal')?.setAttribute('hidden', '');
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();

  document.getElementById('cart-close')?.addEventListener('click', closeCart);
  document.getElementById('cart-backdrop')?.addEventListener('click', closeCart);

  document.querySelectorAll('[data-open-cart]').forEach(el => {
    el.addEventListener('click', openCart);
  });
});
