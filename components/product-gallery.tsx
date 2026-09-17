"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@/lib/products";

export function ProductGallery({ images }: { images: ProductImage[] }) {
  const [active, setActive] = useState(0);
  const image = images[active];
  if (!image) return <div className="product-gallery product-gallery--empty" />;

  return (
    <section className="product-gallery" aria-label="Product images">
      <Image src={image.url} alt={image.altText} width={image.width ?? 1200} height={image.height ?? 1200} priority />
      {images.length > 1 && <div className="gallery-index" aria-label="Choose product image">
        {images.map((item, index) => (
          <button key={item.url} className={index === active ? "active" : ""} type="button" onClick={() => setActive(index)}>
            <span className="sr-only">Show image {index + 1}</span>
          </button>
        ))}
      </div>}
    </section>
  );
}
