import Image from "next/image";
import { HomeWheel } from "@/components/home-wheel";
import styles from "./home.module.css";

export default function HomePage() {
  return (
    <main className={`home-landing ${styles.home}`}>
      <h1 className="sr-only">Final Form Athletics</h1>
      <div className={styles.artwork}>
        <Image
          className={styles.image}
          src="/homepage.png"
          alt="Final Form Athletics. A red, vintage bodybuilding illustration. Established 2003."
          fill
          sizes="(max-width: 900px) 180vw, 100vw"
          loading="eager"
          fetchPriority="high"
        />
      </div>
      <HomeWheel />
    </main>
  );
}
