import { NextResponse } from "next/server";
import { shopifyFetch } from "@/lib/shopify/client";

const CART_REBUILD_MUTATION = `#graphql
  mutation RebuildCart($input: CartInput!) {
    cartCreate(input: $input) {
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

type RebuildResponse = {
  cartCreate: {
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
    userErrors: Array<{ field: string[] | null; message: string }>;
  };
};

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const lines =
      body && typeof body === "object" && "lines" in body
        ? (body as { lines: unknown }).lines
        : null;

    if (
      !Array.isArray(lines) ||
      lines.length < 1 ||
      lines.length > 100 ||
      !lines.every(
        (line) =>
          line &&
          typeof line === "object" &&
          typeof line.merchandiseId === "string" &&
          /^gid:\/\/shopify\/ProductVariant\/\d+$/.test(line.merchandiseId) &&
          Number.isInteger(line.quantity) &&
          line.quantity >= 1 &&
          line.quantity <= 100,
      ) ||
      new Set(lines.map((line) => line.merchandiseId)).size !== lines.length
    ) {
      return NextResponse.json(
        { error: "Invalid cart lines." },
        { status: 400 },
      );
    }

    const data = await shopifyFetch<RebuildResponse>({
      query: CART_REBUILD_MUTATION,
      variables: {
        input: {
          lines: lines.map((line) => ({
            merchandiseId: line.merchandiseId,
            quantity: line.quantity,
          })),
        },
      },
      revalidate: 0,
    });

    const result = data.cartCreate;
    if (result.userErrors.length > 0) {
      return NextResponse.json(
        { error: "CART_REBUILD_FAILED", errors: result.userErrors },
        { status: 400 },
      );
    }
    if (!result.cart) {
      return NextResponse.json(
        { error: "Shopify did not return a rebuilt cart." },
        { status: 502 },
      );
    }

    // Never swap the browser to a new cart if Shopify only accepted some lines.
    const returned = result.cart.lines.nodes;
    const matches =
      returned.length === lines.length &&
      lines.every((requested) =>
        returned.some(
          (received) =>
            received.merchandise.id === requested.merchandiseId &&
            received.quantity === requested.quantity,
        ),
      );
    if (!matches) {
      return NextResponse.json(
        { error: "CART_REBUILD_INCOMPLETE" },
        { status: 409 },
      );
    }

    return NextResponse.json(result.cart);
  } catch (error) {
    console.error("CART REBUILD ERROR:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to rebuild cart.",
      },
      { status: 500 },
    );
  }
}
