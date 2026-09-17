import { addItem, openCart } from "./cart.js";

const menuButton = document.querySelector("[data-menu-toggle]");
menuButton?.addEventListener("click", () => {
  const open = document.body.classList.toggle("menu-open");
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.textContent = open ? "CLOSE" : "MENU";
});

document.querySelectorAll(".mobile-menu a").forEach((link) => link.addEventListener("click", () => {
  document.body.classList.remove("menu-open");
  menuButton?.setAttribute("aria-expanded", "false");
  if (menuButton) menuButton.textContent = "MENU";
}));

document.querySelectorAll("[data-size]").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll("[data-size]").forEach((entry) => entry.classList.remove("selected"));
  button.classList.add("selected");
}));

document.querySelectorAll("[data-add-product]").forEach((button) => button.addEventListener("click", () => {
  const root = button.closest("[data-product]");
  const selectedSize = root?.querySelector("[data-size].selected")?.dataset.size || "M";
  addItem({
    id: root.dataset.product,
    name: root.dataset.name,
    color: root.dataset.color,
    size: selectedSize,
    price: Number(root.dataset.price),
    image: root.dataset.image,
  });
  openCart();
}));

const galleryImage = document.querySelector("[data-gallery-image]");
document.querySelectorAll("[data-gallery-src]").forEach((dot) => dot.addEventListener("click", () => {
  if (!galleryImage) return;
  galleryImage.src = dot.dataset.gallerySrc;
  galleryImage.alt = dot.dataset.galleryAlt || "Product image";
  document.querySelectorAll("[data-gallery-src]").forEach((entry) => entry.classList.remove("active"));
  dot.classList.add("active");
}));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.body.classList.contains("menu-open")) menuButton?.click();
});
