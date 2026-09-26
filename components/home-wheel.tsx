"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";
import styles from "@/app/home.module.css";

const items = [
  { label: "About", href: "/about" },
  { label: "Shop", href: "/collections/drop-001" },
  { label: "Lookbook", href: "/lookbook" },
];
const itemAt = (position: number) => items[((position % items.length) + items.length) % items.length];

export function HomeWheel() {
  const [position, setPosition] = useState(1);
  const viewport = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  const move = useCallback((direction: number) => setPosition((current) => current + direction), []);

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;

    let accumulated = 0;
    let lastEvent = 0;
    let lastStep = -Infinity;
    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;
      event.preventDefault();
      const now = performance.now();
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      const normalized = delta * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientHeight : 1);
      if (now - lastEvent > 160 || Math.sign(normalized) !== Math.sign(accumulated)) accumulated = 0;
      lastEvent = now;
      if (now - lastStep < 500) return;
      accumulated += normalized;
      if (Math.abs(accumulated) >= 35) {
        move(Math.sign(accumulated));
        accumulated = 0;
        lastStep = now;
      }
    };

    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => element.removeEventListener("wheel", handleWheel);
  }, [move]);

  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    if (["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      viewport.current?.focus({ preventScroll: true });
      if (event.key === "Home") setPosition(0);
      else if (event.key === "End") setPosition(2);
      else move(event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1);
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    gesture.current = { x: event.clientX, y: event.clientY };
    dragged.current = false;
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!gesture.current) return;
    const horizontal = window.matchMedia("(max-width: 900px), (max-aspect-ratio: 6/5)").matches;
    const distance = horizontal ? event.clientX - gesture.current.x : event.clientY - gesture.current.y;
    if (Math.abs(distance) < 35) return;
    dragged.current = true;
    gesture.current = null;
    move(distance < 0 ? 1 : -1);
  }

  return (
    <nav className={styles.navigation} aria-label="Explore Final Form">
      <div
        className={styles.wheel}
        ref={viewport}
        tabIndex={0}
        aria-label="Choose a page"
        aria-describedby="wheel-instructions"
        onKeyDown={handleKey}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => { gesture.current = null; }}
        onPointerCancel={() => { gesture.current = null; }}
        onPointerLeave={() => { gesture.current = null; }}
        onClickCapture={(event) => {
          if (dragged.current) {
            event.preventDefault();
            event.stopPropagation();
            dragged.current = false;
          }
        }}
      >
        {Array.from({ length: 7 }, (_, index) => position + index - 3).map((slot) => {
          const offset = slot - position;
          const item = itemAt(slot);
          const visible = Math.abs(offset) <= 1;
          return (
            <div
              key={slot}
              className={styles.slot}
              data-active={offset === 0}
              aria-hidden={!visible || undefined}
              inert={!visible}
              style={{ "--offset": offset, "--distance": Math.abs(offset) } as CSSProperties}
            >
              {offset === 0 ? (
                <Link className={styles.label} href={item.href} draggable={false}>
                  {item.label}<span className={styles.enter} aria-hidden="true">↗</span>
                </Link>
              ) : (
                <button
                  className={styles.label}
                  type="button"
                  tabIndex={visible ? 0 : -1}
                  aria-label={`Select ${item.label}`}
                  onClick={(event) => {
                    if (event.detail === 0) viewport.current?.focus({ preventScroll: true });
                    setPosition(slot);
                  }}
                >
                  {item.label}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div className={styles.controls}>
        <button type="button" onClick={() => move(-1)} aria-label="Previous page">
          <span className={styles.verticalArrow} aria-hidden="true">↑</span>
          <span className={styles.horizontalArrow} aria-hidden="true">←</span>
        </button>
        <p id="wheel-instructions">
          <span className={styles.desktopHint}>Scroll to explore</span>
          <span className={styles.mobileHint}>Swipe to explore</span>
        </p>
        <button type="button" onClick={() => move(1)} aria-label="Next page">
          <span className={styles.verticalArrow} aria-hidden="true">↓</span>
          <span className={styles.horizontalArrow} aria-hidden="true">→</span>
        </button>
      </div>
      <p className="sr-only" role="status" aria-live="polite">{itemAt(position).label} selected. Follow the link to enter.</p>
    </nav>
  );
}
