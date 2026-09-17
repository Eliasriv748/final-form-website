"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";

function money(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export default function CartPage() {
  const { lines, count, subtotal, changeQuantity, removeLine } = useCart();

  return (
    <main className="cart-page">
      <header><p>Your selected gear / {count.toString().padStart(2, "0")}</p><h1>Inventory</h1></header>
      {lines.length === 0 ? <section className="cart-empty"><p>Your inventory is currently empty.</p><Link href="/collections/drop-001">Enter Drop 001 →</Link></section> : (
        <div className="cart-layout">
          <section className="cart-lines" aria-label="Cart items">
            {lines.map((line) => <article className="cart-line" key={line.merchandiseId}>
              <Image src={line.image} alt="" width={180} height={180} />
              <div><h2>{line.name}</h2><p>{line.color} / Size {line.size}</p>{line.preorder && <strong>Preorder</strong>}
                <div className="qty"><button type="button" onClick={() => changeQuantity(line.merchandiseId, -1)}>−</button><span>{line.quantity}</span><button type="button" onClick={() => changeQuantity(line.merchandiseId, 1)}>+</button></div>
                <button className="remove-line" type="button" onClick={() => removeLine(line.merchandiseId)}>Remove</button>
              </div>
              <span>{money(line.price * line.quantity, line.currencyCode)}</span>
            </article>)}
          </section>
          <aside className="order-summary"><p>Order summary</p><div><span>Subtotal</span><span>{money(subtotal, lines[0]?.currencyCode)}</span></div><div><span>Shipping</span><span>Calculated at checkout</span></div><button type="button" disabled>Checkout awaiting Shopify</button><small>Connect the Storefront cart mutations before enabling checkout.</small></aside>
        </div>
      )}
    </main>
  );
}
