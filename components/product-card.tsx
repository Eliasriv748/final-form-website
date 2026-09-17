import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/products";
import { formatMoney, getPurchaseState } from "@/lib/products";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const image = product.images[0];
  const variant = product.variants[0];
  const state = variant ? getPurchaseState(variant) : "unavailable";

  return (
    <Link className="product-card" href={`/products/${product.handle}`}>
      <div className="product-card__media">
        {image && <Image src={image.url} alt={image.altText} width={image.width ?? 1000} height={image.height ?? 1000} priority={priority} />}
        <span>{state === "preorder" ? "Preorder" : state === "in_stock" ? "Available" : "Unavailable"}</span>
      </div>
      <div className="product-card__meta">
        <div><h3>{product.title}</h3><p>{product.color}</p></div>
        {variant && <strong>{formatMoney(variant.price)}</strong>}
      </div>
    </Link>
  );
}
