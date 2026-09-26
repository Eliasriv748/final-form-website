"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-provider";

const links = [
  { href: "/collections/drop-001", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/lookbook", label: "Lookbook" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { count, setOpen: setCartOpen } = useCart();

  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);
    return () => document.body.classList.remove("menu-open");
  }, [menuOpen]);

  return (
    <>
      <header className="site-header">
        <Link className="wordmark" href="/" aria-label="Final Form home">
          FINAL FORM
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}
        </nav>
        <div className="header-actions">
          <button className="cart-trigger" type="button" onClick={() => setCartOpen(true)}>
            Cart <span aria-label={`${count} items`}>({count})</span>
          </button>
          <button
            className="menu-trigger"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((current) => !current)}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>
      </header>
      <nav className="mobile-menu" id="mobile-menu" aria-label="Mobile navigation" aria-hidden={!menuOpen}>
        {links.map((link, index) => (
          <Link href={link.href} key={link.href} onClick={() => setMenuOpen(false)}>
            <span>0{index + 1}</span>{link.label}
          </Link>
        ))}
        <button type="button" onClick={() => { setMenuOpen(false); setCartOpen(true); }}>
          <span>04</span>Cart ({count})
        </button>
      </nav>
    </>
  );
}
