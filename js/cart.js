const CART_KEY = "final-form-cart-v2";

function normaliseCart(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) =>
    item && typeof item.id === "string" && typeof item.name === "string" &&
    Number.isFinite(Number(item.price)) && Number.isFinite(Number(item.qty))
  ).map((item) => ({
    id: item.id,
    name: item.name,
    color: item.color || "",
    size: item.size || "OS",
    price: Number(item.price),
    image: item.image || "",
    qty: Math.max(1, Math.floor(Number(item.qty))),
  }));
}

export function getCart() {
  try { return normaliseCart(JSON.parse(localStorage.getItem(CART_KEY)) || []); }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent("finalform:cart", { detail: cart }));
}

export function addItem(product) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === product.id && item.size === product.size);
  if (existing) existing.qty += 1;
  else cart.push({ ...product, qty: 1 });
  saveCart(cart);
}

export function changeQuantity(id, size, delta) {
  const cart = getCart();
  const item = cart.find((entry) => entry.id === id && entry.size === size);
  if (!item) return;
  item.qty += delta;
  saveCart(cart.filter((entry) => entry.qty > 0));
}

export function removeItem(id, size) {
  saveCart(getCart().filter((item) => item.id !== id || item.size !== size));
}

export function cartCount(cart = getCart()) {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

export function cartSubtotal(cart = getCart()) {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

export function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function buildDrawerItem(item) {
  const row = document.createElement("article");
  row.className = "drawer-item";
  const image = document.createElement("img");
  image.src = item.image;
  image.alt = "";
  const details = document.createElement("div");
  const name = document.createElement("h3");
  name.textContent = item.name;
  const meta = document.createElement("p");
  meta.textContent = `${item.color} / SIZE ${item.size}`;
  const qty = document.createElement("div");
  qty.className = "qty";
  qty.innerHTML = `<button type="button" aria-label="Decrease quantity">−</button><span>${item.qty}</span><button type="button" aria-label="Increase quantity">+</button>`;
  const [minus, plus] = qty.querySelectorAll("button");
  minus.addEventListener("click", () => changeQuantity(item.id, item.size, -1));
  plus.addEventListener("click", () => changeQuantity(item.id, item.size, 1));
  details.append(name, meta, qty);
  const price = document.createElement("span");
  price.className = "drawer-item__price";
  price.textContent = money(item.price * item.qty);
  row.append(image, details, price);
  return row;
}

export function renderCartUI() {
  const cart = getCart();
  document.querySelectorAll("[data-cart-count]").forEach((node) => { node.textContent = String(cartCount(cart)); });
  const drawerItems = document.querySelector("[data-drawer-items]");
  if (!drawerItems) return;
  drawerItems.replaceChildren();
  if (!cart.length) {
    const empty = document.createElement("p");
    empty.className = "drawer-empty";
    empty.textContent = "Your inventory is empty.";
    drawerItems.append(empty);
  } else cart.forEach((item) => drawerItems.append(buildDrawerItem(item)));
  const subtotal = document.querySelector("[data-drawer-subtotal]");
  if (subtotal) subtotal.textContent = money(cartSubtotal(cart));
}

export function openCart() {
  renderCartUI();
  document.body.classList.add("drawer-open");
  document.querySelector("[data-close-cart]")?.focus();
}

export function closeCart() { document.body.classList.remove("drawer-open"); }

function initCart() {
  renderCartUI();
  document.querySelectorAll("[data-open-cart]").forEach((button) => button.addEventListener("click", openCart));
  document.querySelectorAll("[data-close-cart]").forEach((button) => button.addEventListener("click", closeCart));
  document.querySelector("[data-cart-backdrop]")?.addEventListener("click", closeCart);
  window.addEventListener("finalform:cart", renderCartUI);
  window.addEventListener("storage", renderCartUI);
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeCart(); });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initCart);
else initCart();
