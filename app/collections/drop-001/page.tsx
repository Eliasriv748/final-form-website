import { ProductCard } from "@/components/product-card";
import { getProducts } from "@/lib/catalog";

export const metadata = { title: "Drop 001" };

export default async function CollectionPage() {
  const products = await getProducts();

  return (
    <main className="collection-page">
      <header className="collection-hero">
        <p>Final Form / Season 01</p>
        <h1>Drop<br />001</h1>
        <span>{products.length.toString().padStart(2, "0")} pieces</span>
      </header>
      <section className="collection-products" aria-label="Drop 001 products">
        {products.map((product, index) => <ProductCard product={product} priority={index < 2} key={product.id} />)}
      </section>
      <aside className="collection-note">
        <p>Field note 001</p>
        <h2>Every piece begins<br />as equipment.</h2>
        <p>Drop 001 is cut for movement in cotton jersey. When available inventory reaches zero, eligible pieces transition into a clearly marked preorder state.</p>
      </aside>
    </main>
  );
}
