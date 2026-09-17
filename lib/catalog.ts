import type { Product } from "@/lib/products";
import { getShopifyProducts } from "@/lib/shopify/catalog";

const sizes = ["XS", "S", "M", "L", "XL"];

function previewVariants(product: "red" | "black") {
  return sizes.map((size) => ({
    id: `preview://final-ringer-${product}/${size}`,
    title: size,
    availableForSale: true,
    quantityAvailable: null,
    preorderEligible: false,
    price: { amount: "45.00", currencyCode: "USD" },
  }));
}

export const previewProducts: Product[] = [
  {
    id: "preview://final-ringer-red",
    handle: "final-ringer-red",
    title: "The Final Ringer",
    color: "Red / Optic White",
    description: "Old-era athletic construction, cut for movement now.",
    details: [
      "Classic athletic fit",
      "100% cotton jersey",
      "Contrast rib collar and cuffs",
      "Final Form front graphic",
    ],
    images: [
      { url: "/ringer-red-product.webp", altText: "White Final Form ringer tee with red trim" },
      { url: "/final-ringer-1.webp", altText: "Red Final Ringer laid flat" },
      { url: "/final-ringer-2.webp", altText: "Detail of the red Final Ringer collar" },
      { url: "/final-ringer-3.webp", altText: "Detail of the Final Form chest print" },
    ],
    variants: previewVariants("red"),
  },
  {
    id: "preview://final-ringer-black",
    handle: "final-ringer-black",
    title: "The Final Ringer",
    color: "Black / Optic White",
    description: "Old-era athletic construction, cut for movement now.",
    details: [
      "Classic athletic fit",
      "100% cotton jersey",
      "Contrast rib collar and cuffs",
      "Final Form front graphic",
    ],
    images: [
      { url: "/ringer-black-product.webp", altText: "White Final Form ringer tee with black trim" },
    ],
    variants: previewVariants("black"),
  },
];

export async function getProducts(): Promise<Product[]> {
  const products = await getShopifyProducts();
  return products ?? previewProducts;
}

export async function getProduct(handle: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find((product) => product.handle === handle) ?? null;
}
