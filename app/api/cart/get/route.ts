import { NextResponse } from "next/server";
import { shopifyFetch } from "@/lib/shopify/client";

const CART_QUERY = `#graphql
  query GetCart($cartId: ID!) {
    cart(id: $cartId) {
      id
      checkoutUrl
      totalQuantity
      lines(first: 100) {
        nodes {
          id
          quantity
          merchandise {
            ... on ProductVariant {
              id
              title
              availableForSale
              quantityAvailable
              price {
                amount
                currencyCode
              }
              image {
                url
                altText
              }
              product {
                handle
                title
                productType
              }
            }
          }
        }
      }
    }
  }
`;

type CartResponse = {
  cart: {
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
  } | null;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cartId = body.cartId;

    if (!cartId || typeof cartId !== "string") {
      return NextResponse.json({ error: "Missing cartId" }, { status: 400 });
    }

    const data = await shopifyFetch<CartResponse>({
      query: CART_QUERY,
      variables: { cartId },
      revalidate: 0,
    });

    if (!data.cart) {
      return NextResponse.json(
        { error: "Cart not found or expired." },
        { status: 404 },
      );
    }

    return NextResponse.json(data.cart);
  } catch (error) {
    console.error("CART GET ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to retrieve Shopify cart.",
      },
      { status: 500 },
    );
  }
}
