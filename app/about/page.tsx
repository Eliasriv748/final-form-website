import type { Metadata } from "next";
import Link from "next/link";
import styles from "../editorial.module.css";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <main className={styles.page}>
      <p className={styles.eyebrow}>Final Form Athletics / Est. 2003</p>
      <h1>Old-era athletics.<br />Built for now.</h1>
      <div className={styles.story}>
        <p>Final Form is fit-casual apparel for movement inside and outside the gym. Each piece is made to feel earned, worn in, and ready for whatever comes next.</p>
        <p>Drop 001 marks the beginning: everyday pieces informed by the confidence, graphics, and silhouettes of old-era athletics. Limited quantities. No automatic restocks.</p>
      </div>
      <Link className={styles.link} href="/collections/drop-001">Explore Drop 001 <span aria-hidden="true">↗</span></Link>
    </main>
  );
}
