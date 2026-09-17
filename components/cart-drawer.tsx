"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useCart } from "@/components/cart-provider";

function money(amount: number, currencyCode = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currencyCode }).format(amount);
}

export function CartDrawer() {
  const { lines, count, subtotal, open, setOpen, changeQuantity } = useCart();
  const closeButton = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const returnFocusTo = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab" || !drawer.current) return;
      const focusable = Array.from(
        drawer.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      returnFocusTo?.focus();
    };
  }, [open, setOpen]);

  return (
    <>
      <button className="drawer-backdrop" type="button" aria-label="Close cart" onClick={() => setOpen(false)} />
      <aside ref={drawer} className="cart-drawer" role="dialog" aria-modal="true" aria-label="Cart" aria-hidden={!open}>
        <div className="drawer-head">
          <h2>Inventory ({count})</h2>
          <button ref={closeButton} className="icon-button" type="button" onClick={() => setOpen(false)} aria-label="Close cart">×</button>
        </div>
        <div className="drawer-items">
          {lines.length === 0 ? <p className="drawer-empty">Your inventory is empty.</p> : lines.map((line) => (
            <article className="drawer-item" key={line.merchandiseId}>
              <Image src={line.image} alt="" width={84} height={84} />
              <div>
                <h3>{line.name}</h3>
                <p>{line.color} / Size {line.size}{line.preorder ? " / Preorder" : ""}</p>
                <div className="qty">
                  <button type="button" aria-label={`Decrease ${line.name} quantity`} onClick={() => changeQuantity(line.merchandiseId, -1)}>−</button>
                  <span>{line.quantity}</span>
                  <button type="button" aria-label={`Increase ${line.name} quantity`} onClick={() => changeQuantity(line.merchandiseId, 1)}>+</button>
                </div>
              </div>
              <span>{money(line.price * line.quantity, line.currencyCode)}</span>
            </article>
          ))}
        </div>
        <div className="drawer-foot">
          <div><span>Subtotal</span><span>{money(subtotal, lines[0]?.currencyCode)}</span></div>
          <Link href="/cart" onClick={() => setOpen(false)}>Review inventory</Link>
        </div>
      </aside>
    </>
  );
}
