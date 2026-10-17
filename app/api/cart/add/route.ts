import { NextResponse } from "next/server";
import { shopifyFetch } from "@/lib/shopify/client";

const CART_LINES_ADD_MUTATION = `#graphql
  mutation CartLinesAdd(
    $cartId: ID!
    $lines: [CartLineInput!]!
  ) {
    cartLinesAdd(
      cartId: $cartId
      lines: $lines
    ) {
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

type CartLinesAddResponse = {
  cartLinesAdd: {
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
    const merchandiseId = body.merchandiseId;

    if (!cartId || typeof cartId !== "string") {
      return NextResponse.json(
        { error: "Missing cartId" },
        { status: 400 },
      );
    }

    if (
      !merchandiseId ||
      typeof merchandiseId !== "string"
    ) {
      return NextResponse.json(
        { error: "Missing merchandiseId" },
        { status: 400 },
      );
    }

    const data = await shopifyFetch<CartLinesAddResponse>({
      query: CART_LINES_ADD_MUTATION,
      variables: {
        cartId,
        lines: [
          {
            merchandiseId,
            quantity: 1,
          },
        ],
      },
      revalidate: 0,
    });

    if (data.cartLinesAdd.userErrors.length > 0) {
      return NextResponse.json(
        {
          errors: data.cartLinesAdd.userErrors,
        },
        { status: 400 },
      );
    }

    if (!data.cartLinesAdd.cart) {
      return NextResponse.json(
        {
          error: "Shopify did not return a cart.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      data.cartLinesAdd.cart,
    );
  } catch (error) {
    console.error("CART ADD ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to add item to Shopify cart.",
      },
      { status: 500 },
    );
  }
}
