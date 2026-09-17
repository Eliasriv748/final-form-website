"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/components/cart-provider";
import type { Product } from "@/lib/products";
import { formatMoney, getPurchaseState } from "@/lib/products";

export function ProductPurchase({ product }: { product: Product }) {
  const [selectedId, setSelectedId] = useState(product.variants[0]?.id ?? "");
  const { addLine } = useCart();
  const selected = useMemo(
    () => product.variants.find((variant) => variant.id === selectedId),
    [product.variants, selectedId],
  );
  const state = selected ? getPurchaseState(selected) : "unavailable";

  if (!selected) return <p className="product-status product-status--unavailable">Unavailable</p>;

  const buttonLabel = state === "preorder" ? "Preorder" : state === "in_stock" ? "Add to inventory" : "Unavailable";

  return (
    <div className="purchase-panel">
      <div className="size-heading"><span>Select size</span><button type="button">Size guide</button></div>
      <div className="size-row" role="group" aria-label="Select size">
        {product.variants.map((variant) => {
          const variantState = getPurchaseState(variant);
          return (
            <button
              key={variant.id}
              className={variant.id === selectedId ? "selected" : ""}
              type="button"
              disabled={variantState === "unavailable"}
              onClick={() => setSelectedId(variant.id)}
              aria-pressed={variant.id === selectedId}
            >{variant.title}</button>
          );
        })}
      </div>
      <button
        className="purchase-button"
        type="button"
        disabled={state === "unavailable"}
        onClick={() => addLine({
          merchandiseId: selected.id,
          productHandle: product.handle,
          name: product.title,
          color: product.color,
          size: selected.title,
          price: Number(selected.price.amount),
          currencyCode: selected.price.currencyCode,
          image: product.images[0]?.url ?? "",
          preorder: state === "preorder",
        })}
      >{buttonLabel} <span>{formatMoney(selected.price)}</span></button>
      <p className={`product-status product-status--${state}`}>
        {state === "in_stock" && "In stock · Ready to ship"}
        {state === "preorder" && "Preorder · Ships when production completes"}
        {state === "unavailable" && "Currently unavailable"}
      </p>
      {state === "preorder" && <p className="preorder-note">This size has moved into preorder. Estimated timing will be confirmed before checkout.</p>}
    </div>
  );
}
