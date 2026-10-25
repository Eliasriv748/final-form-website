import { NextResponse } from "next/server";
import { shopifyFetch } from "@/lib/shopify/client";

const CART_LINES_REMOVE_MUTATION = `#graphql
  mutation CartLinesRemove(
    $cartId: ID!
    $lineIds: [ID!]!
  ) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
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
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

type CartLinesRemoveResponse = {
  cartLinesRemove: {
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
          };
        }>;
      };
    } | null;
    userErrors: Array<{
      field: string[] | null;
      message: string;
    }>;
  };
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const cartId = body.cartId;
    const lineId = body.lineId;

    if (!cartId || typeof cartId !== "string") {
      return NextResponse.json({ error: "Missing cartId" }, { status: 400 });
    }

    if (!lineId || typeof lineId !== "string") {
      return NextResponse.json({ error: "Missing lineId" }, { status: 400 });
    }

    const data = await shopifyFetch<CartLinesRemoveResponse>({
      query: CART_LINES_REMOVE_MUTATION,
      variables: {
        cartId,
        lineIds: [lineId],
      },
      revalidate: 0,
    });

    if (data.cartLinesRemove.userErrors.length > 0) {
      return NextResponse.json(
        { errors: data.cartLinesRemove.userErrors },
        { status: 400 },
      );
    }

    if (!data.cartLinesRemove.cart) {
      return NextResponse.json(
        { error: "Shopify did not return a cart." },
        { status: 500 },
      );
    }

    return NextResponse.json(data.cartLinesRemove.cart);
  } catch (error) {
    console.error("CART REMOVE ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to remove item from Shopify cart.",
      },
      { status: 500 },
    );
  }
}
