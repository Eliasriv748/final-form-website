import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { getProducts } from "@/lib/catalog";

export default async function HomePage() {
  const products = await getProducts();

  return (
    <main>
      <section className="home-hero" aria-labelledby="hero-title">
        <div className="hero-field" aria-hidden="true"><span /><span /><span /></div>
        <p className="hero-kicker">Drop 001 · New York · 2026</p>
        <h1 id="hero-title"><span>FINAL</span><span>FORM</span></h1>
        <p className="hero-manifesto">Old-era athletics<br />built for now.</p>
        <Link className="hero-enter" href="#collection">Enter the drop <span>↓</span></Link>
      </section>

      <section className="type-scene" id="collection" aria-label="Collection statement">
        <p>Scene 02 / The first rep</p>
        <h2>FORM IS<br />EARNED.</h2>
        <span>Not given.</span>
      </section>

      {products[0] && <section className="single-product-scene">
        <div className="single-product-copy">
          <p>Object 001</p>
          <h2>The Final<br />Ringer</h2>
          <p>A uniform for the work before the result.</p>
          <Link href={`/products/${products[0].handle}`}>Study the piece →</Link>
        </div>
        <ProductCard product={products[0]} priority />
      </section>}

      <section className="campaign-scene" id="projects">
        <figure className="campaign-image campaign-image--large">
          <Image src="/final-ringer-2.webp" alt="Final Ringer collar and label detail" width={1200} height={1400} />
          <figcaption>Campaign study 001 / Collar</figcaption>
        </figure>
        <div className="campaign-copy">
          <p>Archive entry 001</p>
          <h2>Built from<br />the first rep.</h2>
        </div>
        <figure className="campaign-image campaign-image--small">
          <Image src="/final-ringer-3.webp" alt="Final Form chest print detail" width={900} height={900} />
          <figcaption>Mark / Signal red</figcaption>
        </figure>
      </section>

      <section className="commerce-scene" aria-labelledby="drop-title">
        <header><p>Current pieces / 02</p><h2 id="drop-title">Drop 001</h2><Link href="/collections/drop-001">View collection →</Link></header>
        <div className="commerce-scene__products">
          {products.map((product) => <ProductCard product={product} key={product.id} />)}
        </div>
      </section>

      <section className="red-intervention" aria-label="Final Form statement">
        <p>Limited run / No automatic restock</p>
        <h2>EQUIP OR<br />MISS OUT.</h2>
        <span>FF / 001</span>
      </section>
    </main>
  );
}
