import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "../editorial.module.css";

export const metadata: Metadata = { title: "Lookbook" };

const images = [
  { src: "/final-ringer-1.webp", alt: "The red Final Ringer laid flat", caption: "01 / The Final Ringer" },
  { src: "/final-ringer-2.webp", alt: "Final Ringer collar and label detail", caption: "02 / The construction" },
  { src: "/final-ringer-3.webp", alt: "Final Form chest print detail", caption: "03 / The mark" },
];

export default function LookbookPage() {
  return (
    <main className={styles.page}>
      <p className={styles.eyebrow}>Lookbook / Drop 001</p>
      <h1>The first rep.</h1>
      <div className={styles.gallery}>
        {images.map((image) => (
          <figure key={image.src}>
            <div className={styles.photo}>
              <Image src={image.src} alt={image.alt} fill sizes="(max-width: 700px) 92vw, 30vw" />
            </div>
            <figcaption>{image.caption}</figcaption>
          </figure>
        ))}
      </div>
      <Link className={styles.link} href="/collections/drop-001">Shop the collection <span aria-hidden="true">↗</span></Link>
    </main>
  );
}
