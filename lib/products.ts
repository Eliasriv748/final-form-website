export type Money = {
  amount: string;
  currencyCode: string;
};

export type ProductImage = {
  url: string;
  altText: string;
  width?: number;
  height?: number;
};

export type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable: number | null;
  preorderEligible: boolean;
  price: Money;
};

export type Product = {
  id: string;
  handle: string;
  title: string;
  color: string;
  description: string;
  details: string[];
  images: ProductImage[];
  variants: ProductVariant[];
};

export type PurchaseState = "in_stock" | "preorder" | "unavailable";

export function getPurchaseState(variant: ProductVariant): PurchaseState {
  if (
    variant.availableForSale &&
    (variant.quantityAvailable === null || variant.quantityAvailable > 0)
  ) {
    return "in_stock";
  }

  if (variant.quantityAvailable === 0 && variant.preorderEligible) {
    return "preorder";
  }

  return "unavailable";
}

export function formatMoney({ amount, currencyCode }: Money) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(Number(amount));
}
