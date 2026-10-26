import type { Product } from "@/lib/products";
import { productEditorial } from "@/lib/product-editorial";
import { previewProducts } from "@/lib/catalog";
import { isShopifyConfigured, shopifyFetch } from "@/lib/shopify/client";

const PRODUCTS_QUERY = `#graphql
  query FinalFormProducts($first: Int!) {
    products(first: $first, sortKey: CREATED_AT, reverse: true) {
      nodes {
        id
        handle
        title
        description
        productType
        options { name optionValues { name } }
        images(first: 8) {
          nodes { url altText width height }
        }
        variants(first: 20) {
          nodes {
            id
            title
            availableForSale
            quantityAvailable
            price { amount currencyCode }
            preorder: metafield(namespace: "custom", key: "preorder_eligible") { value }
          }
        }
      }
    }
  }
`;

type ShopifyProduct = {
  id: string;
  handle: string;
  title: string;
  description: string;
  productType: string;
  options: Array<{ name: string; optionValues: Array<{ name: string }> }>;
  images: { nodes: Product["images"] };
  variants: {
    nodes: Array<{
      id: string;
      title: string;
      availableForSale: boolean;
      quantityAvailable: number | null;
      price: Product["variants"][number]["price"];
      preorder: { value: string } | null;
    }>;
  };
};

function mapProduct(product: ShopifyProduct): Product {
  const colorOption = product.options.find((option) => option.name.toLowerCase() === "color");
  const editorial = productEditorial[product.handle];

  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    color: colorOption?.optionValues.map(({ name }) => name).join(" / ") || product.productType,
    description: editorial?.description ?? product.description,
    details: editorial?.details ?? [],
    images: product.images.nodes,
    variants: product.variants.nodes.map((variant) => ({
      ...variant,
      preorderEligible: variant.preorder?.value === "true",
    })),
  };
}

export async function getShopifyProducts(): Promise<Product[] | null> {
  if (!isShopifyConfigured()) return null;

  try {
    const data = await shopifyFetch<{ products: { nodes: ShopifyProduct[] } }>({
      query: PRODUCTS_QUERY,
      variables: { first: 20 },
    });
    return data.products.nodes.map(mapProduct);
  } catch (error) {
    if (process.env.NODE_ENV === "production") throw error;
    console.warn("Shopify catalog unavailable; using clearly scoped preview catalog.", error);
    return null;
  }
}
