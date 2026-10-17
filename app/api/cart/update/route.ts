import { NextResponse } from "next/server";
import { shopifyFetch } from "@/lib/shopify/client";

const CART_LINES_UPDATE_MUTATION = `#graphql
  mutation CartLinesUpdate(
    $cartId: ID!
    $lines: [CartLineUpdateInput!]!
  ) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
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

type CartLinesUpdateResponse = {
  cartLinesUpdate: {
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
    const quantity = body.quantity;

    if (!cartId || typeof cartId !== "string") {
      return NextResponse.json(
        { error: "Missing cartId" },
        { status: 400 },
      );
    }

    if (!lineId || typeof lineId !== "string") {
      return NextResponse.json(
        { error: "Missing lineId" },
        { status: 400 },
      );
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json(
        { error: "Invalid quantity" },
        { status: 400 },
      );
    }

    const data = await shopifyFetch<CartLinesUpdateResponse>({
      query: CART_LINES_UPDATE_MUTATION,
      variables: {
        cartId,
        lines: [
          {
            id: lineId,
            quantity,
          },
        ],
      },
      revalidate: 0,
    });

    if (data.cartLinesUpdate.userErrors.length > 0) {
      return NextResponse.json(
        { errors: data.cartLinesUpdate.userErrors },
        { status: 400 },
      );
    }

    if (!data.cartLinesUpdate.cart) {
      return NextResponse.json(
        { error: "Shopify did not return a cart." },
        { status: 500 },
      );
    }

    return NextResponse.json(data.cartLinesUpdate.cart);
  } catch (error) {
    console.error("CART UPDATE ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update Shopify cart.",
      },
      { status: 500 },
    );
  }
}
