"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

const CART_KEY = "final-form-cart-v2-next";

export type CartLine = {
  merchandiseId: string;
  productHandle: string;
  name: string;
  color: string;
  size: string;
  price: number;
  currencyCode: string;
  image: string;
  quantity: number;
  preorder: boolean;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  addLine: (line: Omit<CartLine, "quantity">) => void;
  changeQuantity: (merchandiseId: string, delta: number) => void;
  removeLine: (merchandiseId: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function normaliseCart(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  return value.filter((line): line is CartLine => {
    if (!line || typeof line !== "object") return false;
    const candidate = line as Partial<CartLine>;
    return (
      typeof candidate.merchandiseId === "string" &&
      typeof candidate.name === "string" &&
      Number.isFinite(candidate.price) &&
      Number.isFinite(candidate.quantity)
    );
  }).map((line) => ({ ...line, quantity: Math.max(1, Math.floor(line.quantity)) }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        setLines(normaliseCart(JSON.parse(localStorage.getItem(CART_KEY) ?? "[]")));
      } catch {
        setLines([]);
      } finally {
        setHydrated(true);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(CART_KEY, JSON.stringify(lines));
  }, [hydrated, lines]);

  useEffect(() => {
    const syncCart = (event: StorageEvent) => {
      if (event.key !== CART_KEY) return;
      try {
        setLines(normaliseCart(JSON.parse(event.newValue ?? "[]")));
      } catch {
        setLines([]);
      }
    };
    window.addEventListener("storage", syncCart);
    return () => window.removeEventListener("storage", syncCart);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("drawer-open", open);
    return () => document.body.classList.remove("drawer-open");
  }, [open]);

  const addLine = useCallback((line: Omit<CartLine, "quantity">) => {
    setLines((current) => {
      const existing = current.find((item) => item.merchandiseId === line.merchandiseId);
      if (!existing) return [...current, { ...line, quantity: 1 }];
      return current.map((item) => item.merchandiseId === line.merchandiseId
        ? { ...item, quantity: item.quantity + 1 }
        : item);
    });
    setOpen(true);
  }, []);

  const changeQuantity = useCallback((merchandiseId: string, delta: number) => {
    setLines((current) => current
      .map((line) => line.merchandiseId === merchandiseId
        ? { ...line, quantity: line.quantity + delta }
        : line)
      .filter((line) => line.quantity > 0));
  }, []);

  const removeLine = useCallback((merchandiseId: string) => {
    setLines((current) => current.filter((line) => line.merchandiseId !== merchandiseId));
  }, []);

  const value = useMemo(() => ({
    lines,
    count: lines.reduce((total, line) => total + line.quantity, 0),
    subtotal: lines.reduce((total, line) => total + line.price * line.quantity, 0),
    open,
    setOpen,
    addLine,
    changeQuantity,
    removeLine,
  }), [lines, open, addLine, changeQuantity, removeLine]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart must be used inside CartProvider.");
  return cart;
}
