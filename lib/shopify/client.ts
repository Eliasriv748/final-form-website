const domain = process.env.SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN;
const apiVersion = process.env.SHOPIFY_STOREFRONT_API_VERSION ?? "2026-07";

export function isShopifyConfigured() {
  return Boolean(domain && token);
}

type ShopifyResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

export async function shopifyFetch<T>({
  query,
  variables,
  revalidate = 60,
}: {
  query: string;
  variables?: Record<string, unknown>;
  revalidate?: number;
}): Promise<T> {
  if (!domain || !token) {
    throw new Error("Shopify Storefront API is not configured.");
  }

  const response = await fetch(
    `https://${domain.replace(/^https?:\/\//, "")}/api/${apiVersion}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Shopify-Storefront-Private-Token": token,
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate },
    },
  );

  const result = (await response.json()) as ShopifyResponse<T>;

  if (!response.ok || result.errors?.length || !result.data) {
    throw new Error(
      result.errors?.map((error) => error.message).join("; ") ||
        `Shopify request failed with status ${response.status}.`,
    );
  }

  return result.data;
}
