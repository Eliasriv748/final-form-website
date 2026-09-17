import { cartCount, cartSubtotal, changeQuantity, getCart, money, removeItem } from "./cart.js";

function cartRow(item) {
  const row = document.createElement("article");
  row.className = "cart-list__item";
  const image = document.createElement("img");
  image.src = item.image;
  image.alt = "";
  const details = document.createElement("div");
  const name = document.createElement("h2");
  name.textContent = item.name;
  const meta = document.createElement("p");
  meta.className = "eyebrow";
  meta.textContent = `${item.color} / SIZE ${item.size}`;
  const qty = document.createElement("div");
  qty.className = "qty";
  qty.innerHTML = `<button type="button" aria-label="Decrease quantity">−</button><span>${item.qty}</span><button type="button" aria-label="Increase quantity">+</button>`;
  const [minus, plus] = qty.querySelectorAll("button");
  minus.addEventListener("click", () => changeQuantity(item.id, item.size, -1));
  plus.addEventListener("click", () => changeQuantity(item.id, item.size, 1));
  const remove = document.createElement("button");
  remove.className = "remove";
  remove.type = "button";
  remove.textContent = "Remove";
  remove.addEventListener("click", () => removeItem(item.id, item.size));
  details.append(name, meta, qty, remove);
  const price = document.createElement("span");
  price.className = "cart-list__price";
  price.textContent = money(item.price * item.qty);
  row.append(image, details, price);
  return row;
}

function renderPage() {
  const cart = getCart();
  const list = document.querySelector("[data-cart-list]");
  const layout = document.querySelector("[data-cart-layout]");
  const empty = document.querySelector("[data-cart-empty]");
  if (!list || !layout || !empty) return;
  list.replaceChildren();
  cart.forEach((item) => list.append(cartRow(item)));
  layout.hidden = cart.length === 0;
  empty.hidden = cart.length > 0;
  document.querySelectorAll("[data-full-subtotal]").forEach((node) => { node.textContent = money(cartSubtotal(cart)); });
  const count = cartCount(cart);
  const itemLabel = document.querySelector("[data-item-label]");
  if (itemLabel) itemLabel.textContent = `${count} ${count === 1 ? "ITEM" : "ITEMS"}`;
}

window.addEventListener("finalform:cart", renderPage);
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", renderPage);
else renderPage();
