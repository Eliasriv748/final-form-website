"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  quantityAvailable?: number | null;
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
        availableForSale: boolean;
        quantityAvailable: number | null;
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
        quantityAvailable: number | null;
        price: { amount: string; currencyCode: string };
        image: { url: string; altText: string | null } | null;
        product: { handle: string; title: string; productType: string };
      };
    }>;
  };
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  checkoutUrl: string | null;
  cartBusy: boolean;
  hydrated: boolean;
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
      const item = line as Partial<CartLine>;
      return (
        typeof item.merchandiseId === "string" &&
        item.merchandiseId.startsWith("gid://shopify/ProductVariant/") &&
        typeof item.name === "string" &&
        typeof item.productHandle === "string" &&
        typeof item.price === "number" &&
        Number.isFinite(item.price) &&
        typeof item.quantity === "number" &&
        Number.isFinite(item.quantity) &&
        item.quantity > 0
      );
    })
    .map((line) => ({
      ...line,
      quantity: Math.max(1, Math.floor(line.quantity)),
    }));
}

function storeCart(cart: ShopifyCartResponse) {
  localStorage.setItem(SHOPIFY_CART_KEY, cart.id);
  localStorage.setItem(SHOPIFY_CHECKOUT_KEY, cart.checkoutUrl);
}

function mergeShopifyLines(
  previous: CartLine[],
  cart: ShopifyCartResponse,
): CartLine[] {
  return previous.map((line) => {
    const remote = cart.lines.nodes.find(
      (node) => node.merchandise.id === line.merchandiseId,
    );
    if (!remote) return line;
    return {
      ...line,
      shopifyLineId: remote.id,
      quantity: remote.quantity,
      quantityAvailable: remote.merchandise.quantityAvailable,
    };
  });
}

async function rebuildCart(lines: CartLine[]): Promise<ShopifyCartResponse> {
  if (!lines.length) throw new Error("No cart lines to recover.");
  const response = await fetch("/api/cart/rebuild", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lines: lines.map(({ merchandiseId, quantity }) => ({
        merchandiseId,
        quantity,
      })),
    }),
  });
  if (!response.ok) {
    throw new Error((await response.text()) || `HTTP ${response.status}`);
  }
  return (await response.json()) as ShopifyCartResponse;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [cartBusy, setCartBusy] = useState(false);
  const requestInFlight = useRef(false);

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

        try {
          if (!savedCartId) {
            if (savedLines.length > 0) {
              const restored = await rebuildCart(savedLines);
              if (cancelled) return;
              storeCart(restored);
              setLines(mergeShopifyLines(savedLines, restored));
              setCheckoutUrl(restored.checkoutUrl);
            } else if (!cancelled) {
              setLines([]);
              setCheckoutUrl(null);
            }
            return;
          }

          const response = await fetch("/api/cart/get", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cartId: savedCartId }),
            cache: "no-store",
          });
          if (cancelled) return;

          if (response.status === 404) {
            // Only a confirmed missing cart should trigger reconstruction.
            if (savedLines.length > 0) {
              const restored = await rebuildCart(savedLines);
              if (cancelled) return;
              storeCart(restored);
              setLines(mergeShopifyLines(savedLines, restored));
              setCheckoutUrl(restored.checkoutUrl);
            } else {
              localStorage.removeItem(SHOPIFY_CART_KEY);
              localStorage.removeItem(SHOPIFY_CHECKOUT_KEY);
              setLines([]);
              setCheckoutUrl(null);
            }
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
              quantityAvailable: variant.quantityAvailable,
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
          // Don't send someone to a potentially expired checkout.
          setCheckoutUrl(null);
        } finally {
          if (!cancelled) setHydrated(true);
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
      // Do not trust a checkout URL if another tab changed the cart.
      setCheckoutUrl(null);
    };
    window.addEventListener("storage", syncCart);
    return () => window.removeEventListener("storage", syncCart);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("drawer-open", open);
    return () => document.body.classList.remove("drawer-open");
  }, [open]);

  const beginMutation = useCallback(() => {
    if (!hydrated || requestInFlight.current) return false;
    requestInFlight.current = true;
    setCartBusy(true);
    return true;
  }, [hydrated]);

  const endMutation = useCallback(() => {
    requestInFlight.current = false;
    setCartBusy(false);
  }, []);

  const addLine = useCallback(
    async (line: Omit<CartLine, "quantity">) => {
      if (!beginMutation()) return;
      try {
        const existingCartId = localStorage.getItem(SHOPIFY_CART_KEY);
        if (!existingCartId && lines.length > 0) {
          const requested = normaliseCart([
            ...lines.filter(
              (item) => item.merchandiseId !== line.merchandiseId,
            ),
            {
              ...line,
              quantity:
                (lines.find((item) => item.merchandiseId === line.merchandiseId)
                  ?.quantity ?? 0) + 1,
            },
          ]);
          const restored = await rebuildCart(requested);
          storeCart(restored);
          setCheckoutUrl(restored.checkoutUrl);
          setLines(mergeShopifyLines(requested, restored));
          setOpen(true);
          return;
        }
        const response = await fetch(
          existingCartId ? "/api/cart/add" : "/api/cart/create",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              existingCartId
                ? { cartId: existingCartId, merchandiseId: line.merchandiseId }
                : { merchandiseId: line.merchandiseId },
            ),
          },
        );

        if (response.status === 404 && existingCartId) {
          const data: unknown = await response.json().catch(() => null);
          const isExpired =
            !!data &&
            typeof data === "object" &&
            "error" in data &&
            data.error === "CART_EXPIRED";
          if (isExpired) {
            setCheckoutUrl(null);
            const previous = normaliseCart([
              ...lines.filter(
                (item) => item.merchandiseId !== line.merchandiseId,
              ),
              {
                ...line,
                quantity:
                  (lines.find(
                    (item) => item.merchandiseId === line.merchandiseId,
                  )?.quantity ?? 0) + 1,
              },
            ]);
            const restored = await rebuildCart(previous);
            storeCart(restored);
            setCheckoutUrl(restored.checkoutUrl);
            setLines(mergeShopifyLines(previous, restored));
            setOpen(true);
            return;
          }
          console.error("Unable to add item to cart: unexpected 404", data);
          return;
        }

        if (!response.ok) {
          console.error(
            "Unable to sync Shopify cart:",
            (await response.text()) || `HTTP ${response.status}`,
          );
          return;
        }
        const cart = (await response.json()) as ShopifyCartResponse;
        const newLine = cart.lines.nodes.find(
          (node) => node.merchandise.id === line.merchandiseId,
        );
        if (!newLine) throw new Error("Shopify did not return the added line.");
        storeCart(cart);
        setCheckoutUrl(cart.checkoutUrl);
        setLines((current) => {
          const existing = current.find(
            (item) => item.merchandiseId === line.merchandiseId,
          );
          if (!existing)
            return [
              ...current,
              {
                ...line,
                shopifyLineId: newLine.id,
                quantity: newLine.quantity,
                quantityAvailable: newLine.merchandise.quantityAvailable,
              },
            ];
          return current.map((item) =>
            item.merchandiseId === line.merchandiseId
              ? {
                  ...item,
                  shopifyLineId: newLine.id,
                  quantity: newLine.quantity,
                  quantityAvailable: newLine.merchandise.quantityAvailable,
                }
              : item,
          );
        });
        setOpen(true);
      } catch (error) {
        console.error("Unable to add item to cart:", error);
      } finally {
        endMutation();
      }
    },
    [lines, beginMutation, endMutation],
  );

  const removeLine = useCallback(
    async (merchandiseId: string) => {
      if (!beginMutation()) return;
      try {
        const cartId = localStorage.getItem(SHOPIFY_CART_KEY);
        const currentLine = lines.find(
          (item) => item.merchandiseId === merchandiseId,
        );
        if (!cartId || !currentLine?.shopifyLineId) {
          console.error("Missing Shopify cart ID or cart line ID.");
          return;
        }
        const response = await fetch("/api/cart/remove", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cartId, lineId: currentLine.shopifyLineId }),
        });
        if (!response.ok) {
          console.error(
            "Unable to remove line from Shopify cart:",
            await response.text(),
          );
          return;
        }
        const cart = (await response.json()) as ShopifyCartResponse;
        storeCart(cart);
        setCheckoutUrl(cart.checkoutUrl);
        setLines((current) =>
          current.filter((item) => item.merchandiseId !== merchandiseId),
        );
      } catch (error) {
        console.error("Unable to remove item from cart:", error);
      } finally {
        endMutation();
      }
    },
    [lines, beginMutation, endMutation],
  );

  const changeQuantity = useCallback(
    async (merchandiseId: string, delta: number) => {
      const currentLine = lines.find(
        (item) => item.merchandiseId === merchandiseId,
      );

      if (!currentLine) return;

      const newQuantity = currentLine.quantity + delta;

      if (newQuantity < 1) {
        await removeLine(merchandiseId);
        return;
      }

      if (!beginMutation()) return;

      try {
        const cartId = localStorage.getItem(SHOPIFY_CART_KEY);

        const recoverCart = async () => {
          const requestedLines = lines.map((item) =>
            item.merchandiseId === merchandiseId
              ? { ...item, quantity: newQuantity }
              : item,
          );

          // Preserve all existing items and requested quantities.
          const rebuilt = await rebuildCart(requestedLines);

          // Only replace the saved cart after Shopify confirms success.
          storeCart(rebuilt);
          setCheckoutUrl(rebuilt.checkoutUrl);
          setLines(mergeShopifyLines(requestedLines, rebuilt));
        };

        if (!cartId || !currentLine.shopifyLineId) {
          await recoverCart();
          return;
        }

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

        if (response.status === 404) {
          const data: unknown = await response.json().catch(() => null);

          const isExpired =
            data !== null &&
            typeof data === "object" &&
            "error" in data &&
            data.error === "CART_EXPIRED";

          if (isExpired) {
            setCheckoutUrl(null);
            await recoverCart();
            return;
          }
        }

        if (!response.ok) {
          console.error(
            "Unable to update Shopify cart:",
            (await response.text()) || `HTTP ${response.status}`,
          );
          return;
        }

        const cart = (await response.json()) as ShopifyCartResponse;

        storeCart(cart);
        setCheckoutUrl(cart.checkoutUrl);

        setLines((current) => mergeShopifyLines(current, cart));
      } catch (error) {
        console.error("Unable to update or recover Shopify cart:", error);
      } finally {
        endMutation();
      }
    },
    [lines, removeLine, beginMutation, endMutation],
  );

  const value = useMemo(
    () => ({
      lines,
      count: lines.reduce((total, line) => total + line.quantity, 0),
      subtotal: lines.reduce(
        (total, line) => total + line.price * line.quantity,
        0,
      ),
      checkoutUrl:
        hydrated && !cartBusy && lines.length > 0 ? checkoutUrl : null,
      cartBusy,
      hydrated,
      open,
      setOpen,
      addLine,
      changeQuantity,
      removeLine,
    }),
    [
      lines,
      checkoutUrl,
      cartBusy,
      hydrated,
      open,
      addLine,
      changeQuantity,
      removeLine,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart must be used inside CartProvider.");
  return cart;
}
