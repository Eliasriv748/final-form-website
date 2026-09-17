import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/product-gallery";
import { ProductPurchase } from "@/components/product-purchase";
import { getProduct, getProducts } from "@/lib/catalog";
import { formatMoney } from "@/lib/products";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map(({ handle }) => ({ handle }));
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) notFound();
  const price = product.variants[0]?.price;

  return (
    <main className="product-page">
      <ProductGallery images={product.images} />
      <section className="product-info">
        <p className="product-code">Drop 001 / {product.handle.endsWith("red") ? "FF-001" : "FF-002"}</p>
        <h1>{product.title}</h1>
        <p className="product-price">{price && formatMoney(price)} / {product.color}</p>
        <p className="product-description">{product.description}</p>
        <ul>{product.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
        <ProductPurchase product={product} />
        <details><summary>Shipping and returns</summary><p>Shipping timing is calculated at checkout. Preorder timing is shown before purchase when applicable.</p></details>
        <details><summary>Care</summary><p>Wash cold with like colors. Dry low. Wear often.</p></details>
      </section>
    </main>
  );
}
