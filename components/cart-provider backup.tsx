"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

const CART_KEY = "final-form-cart-v2-next";
const SHOPIFY_CART_KEY = "final-form-shopify-cart-id";
const SHOPIFY_CHECKOUT_KEY = "final-form-shopify-checkout-url";

export type CartLine = {
  merchandiseId: string;
  shopifyLineId?: string;
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

type ShopifyCartResponse = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  lines: {
    nodes: Array<{
      id: string;
      quantity: number;
      merchandise: {
        id: string;
        title: string;
      };
    }>;
  };
};

type ShopifyCartLookupResponse = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  lines: {
    nodes: Array<{
      id: string;
      quantity: number;
      merchandise: {
        id: string;
        title: string;
        availableForSale: boolean;
        price: {
          amount: string;
          currencyCode: string;
        };
        image: {
          url: string;
          altText: string | null;
        } | null;
        product: {
          handle: string;
          title: string;
          productType: string;
        };
      };
    }>;
  };
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  checkoutUrl: string | null;
  open: boolean;
  setOpen: (open: boolean) => void;
  addLine: (line: Omit<CartLine, "quantity">) => Promise<void>;
  changeQuantity: (merchandiseId: string, delta: number) => Promise<void>;
  removeLine: (merchandiseId: string) => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

function normaliseCart(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((line): line is CartLine => {
      if (!line || typeof line !== "object") return false;

      const candidate = line as Partial<CartLine>;

      return (
        typeof candidate.merchandiseId === "string" &&
        typeof candidate.shopifyLineId === "string" &&
        candidate.shopifyLineId.startsWith("gid://shopify/CartLine/") &&
        typeof candidate.name === "string" &&
        typeof candidate.price === "number" &&
        Number.isFinite(candidate.price) &&
        typeof candidate.quantity === "number" &&
        Number.isFinite(candidate.quantity) &&
        candidate.quantity > 0
      );
    })
    .map((line) => ({
      ...line,
      quantity: Math.max(1, Math.floor(line.quantity)),
    }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [cartBusy, setCartBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const frame = requestAnimationFrame(() => {
      const restoreCart = async () => {
        let savedLines: CartLine[] = [];

        try {
          savedLines = normaliseCart(
            JSON.parse(localStorage.getItem(CART_KEY) ?? "[]"),
          );
        } catch {
          savedLines = [];
        }

        const savedCartId = localStorage.getItem(SHOPIFY_CART_KEY);
        const savedCheckoutUrl = localStorage.getItem(SHOPIFY_CHECKOUT_KEY);

        if (!savedCartId) {
          if (!cancelled) {
            setLines([]);
            setCheckoutUrl(null);
            setHydrated(true);
          }
          return;
        }

        try {
          const response = await fetch("/api/cart/get", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              cartId: savedCartId,
            }),
            cache: "no-store",
          });

          if (cancelled) return;

          if (response.status === 404) {
            localStorage.removeItem(CART_KEY);
            localStorage.removeItem(SHOPIFY_CART_KEY);
            localStorage.removeItem(SHOPIFY_CHECKOUT_KEY);

            setLines([]);
            setCheckoutUrl(null);
            return;
          }

          if (!response.ok) {
            throw new Error(`Unable to restore cart: HTTP ${response.status}`);
          }

          const cart = (await response.json()) as ShopifyCartLookupResponse;

          if (cancelled) return;

          const restoredLines: CartLine[] = cart.lines.nodes.map((node) => {
            const variant = node.merchandise;

            const previous = savedLines.find(
              (item) => item.merchandiseId === variant.id,
            );

            return {
              merchandiseId: variant.id,
              shopifyLineId: node.id,
              productHandle: variant.product.handle,
              name: variant.product.title,
              color: previous?.color ?? variant.product.productType,
              size: variant.title,
              price: Number(variant.price.amount),
              currencyCode: variant.price.currencyCode,
              image: variant.image?.url ?? previous?.image ?? "",
              quantity: node.quantity,
              preorder: previous?.preorder ?? false,
            };
          });

          setLines(restoredLines);
          setCheckoutUrl(cart.checkoutUrl);

          localStorage.setItem(SHOPIFY_CART_KEY, cart.id);
          localStorage.setItem(SHOPIFY_CHECKOUT_KEY, cart.checkoutUrl);
        } catch (error) {
          if (cancelled) return;

          console.error("Shopify cart restoration failed:", error);

          setLines(savedLines);
          setCheckoutUrl(savedCheckoutUrl);
        } finally {
          if (!cancelled) {
            setHydrated(true);
          }
        }
      };

      void restoreCart();
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(CART_KEY, JSON.stringify(lines));
    }
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

    return () => {
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("drawer-open", open);

    return () => {
      document.body.classList.remove("drawer-open");
    };
  }, [open]);

  const addLine = useCallback(
    async (line: Omit<CartLine, "quantity">) => {
      if (cartBusy) return;

      setCartBusy(true);

      try {
        const existingShopifyCartId = localStorage.getItem(SHOPIFY_CART_KEY);

        let response: Response;

        if (!existingShopifyCartId) {
          response = await fetch("/api/cart/create", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              merchandiseId: line.merchandiseId,
            }),
          });
        } else {
          response = await fetch("/api/cart/add", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              cartId: existingShopifyCartId,
              merchandiseId: line.merchandiseId,
            }),
          });
        }

        if (!response.ok) {
          const errorText = await response.text();

          console.error(
            "Unable to sync Shopify cart:",
            errorText || `HTTP ${response.status}`,
          );

          return;
        }

        const cart = (await response.json()) as ShopifyCartResponse;

        localStorage.setItem(SHOPIFY_CART_KEY, cart.id);

        localStorage.setItem(SHOPIFY_CHECKOUT_KEY, cart.checkoutUrl);

        setCheckoutUrl(cart.checkoutUrl);

        const shopifyLine = cart.lines.nodes.find(
          (item) => item.merchandise.id === line.merchandiseId,
        );

        if (!shopifyLine) {
          console.error(
            "Shopify cart line was not returned for:",
            line.merchandiseId,
          );

          return;
        }

        setLines((current) => {
          const existing = current.find(
            (item) => item.merchandiseId === line.merchandiseId,
          );

          if (!existing) {
            return [
              ...current,
              {
                ...line,
                shopifyLineId: shopifyLine.id,
                quantity: shopifyLine.quantity,
              },
            ];
          }

          return current.map((item) =>
            item.merchandiseId === line.merchandiseId
              ? {
                  ...item,
                  shopifyLineId: shopifyLine.id,
                  quantity: shopifyLine.quantity,
                }
              : item,
          );
        });

        setOpen(true);
      } finally {
        setCartBusy(false);
      }
    },
    [cartBusy],
  );

  const removeLine = useCallback(
    async (merchandiseId: string) => {
      if (cartBusy) return;

      setCartBusy(true);

      try {
        const cartId = localStorage.getItem(SHOPIFY_CART_KEY);

        if (!cartId) {
          console.error("Missing Shopify cart ID.");
          return;
        }

        const currentLine = lines.find(
          (line) => line.merchandiseId === merchandiseId,
        );

        if (!currentLine?.shopifyLineId) {
          console.error("Missing Shopify cart line ID.");
          return;
        }

        const response = await fetch("/api/cart/remove", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cartId,
            lineId: currentLine.shopifyLineId,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();

          console.error(
            "Unable to remove line from Shopify cart:",
            errorText || `HTTP ${response.status}`,
          );

          return;
        }

        const cart = (await response.json()) as ShopifyCartResponse;

        localStorage.setItem(SHOPIFY_CHECKOUT_KEY, cart.checkoutUrl);

        setCheckoutUrl(cart.checkoutUrl);

        setLines((current) =>
          current.filter((line) => line.merchandiseId !== merchandiseId),
        );
      } finally {
        setCartBusy(false);
      }
    },
    [lines, cartBusy],
  );

  const changeQuantity = useCallback(
    async (merchandiseId: string, delta: number) => {
      if (cartBusy) return;

      const cartId = localStorage.getItem(SHOPIFY_CART_KEY);

      if (!cartId) {
        console.error("Missing Shopify cart ID.");
        return;
      }

      const currentLine = lines.find(
        (line) => line.merchandiseId === merchandiseId,
      );

      if (!currentLine?.shopifyLineId) {
        console.error("Missing Shopify cart line ID.");
        return;
      }

      const newQuantity = currentLine.quantity + delta;

      if (newQuantity < 1) {
        await removeLine(merchandiseId);
        return;
      }

      setCartBusy(true);

      try {
        const response = await fetch("/api/cart/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cartId,
            lineId: currentLine.shopifyLineId,
            quantity: newQuantity,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();

          console.error(
            "Unable to update Shopify cart:",
            errorText || `HTTP ${response.status}`,
          );

          return;
        }

        const cart = (await response.json()) as ShopifyCartResponse;

        localStorage.setItem(SHOPIFY_CHECKOUT_KEY, cart.checkoutUrl);

        setCheckoutUrl(cart.checkoutUrl);

        setLines((current) =>
          current.map((line) => {
            const shopifyLine = cart.lines.nodes.find(
              (item) => item.merchandise.id === line.merchandiseId,
            );

            if (!shopifyLine) {
              return line;
            }

            return {
              ...line,
              shopifyLineId: shopifyLine.id,
              quantity: shopifyLine.quantity,
            };
          }),
        );
      } finally {
        setCartBusy(false);
      }
    },
    [lines, removeLine, cartBusy],
  );

  const value = useMemo(
    () => ({
      lines,
      count: lines.reduce((total, line) => total + line.quantity, 0),
      subtotal: lines.reduce(
        (total, line) => total + line.price * line.quantity,
        0,
      ),
      checkoutUrl,
      open,
      setOpen,
      addLine,
      changeQuantity,
      removeLine,
    }),
    [lines, checkoutUrl, open, addLine, changeQuantity, removeLine],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const cart = useContext(CartContext);

  if (!cart) {
    throw new Error("useCart must be used inside CartProvider.");
  }

  return cart;
}
