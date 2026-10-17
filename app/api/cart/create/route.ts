import { NextResponse } from "next/server";
import { shopifyFetch } from "@/lib/shopify/client";

const CART_CREATE_MUTATION = `#graphql
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        totalQuantity
        cost {
          subtotalAmount {
            amount
            currencyCode
          }
        }
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

type CartCreateResponse = {
  cartCreate: {
    cart: {
      id: string;
      checkoutUrl: string;
      totalQuantity: number;
      cost: {
        subtotalAmount: {
          amount: string;
          currencyCode: string;
        };
      };
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
  const body = await request.json();

  const merchandiseId = body.merchandiseId;

  if (!merchandiseId || typeof merchandiseId !== "string") {
    return NextResponse.json(
      { error: "Missing merchandiseId" },
      { status: 400 },
    );
  }

  const data = await shopifyFetch<CartCreateResponse>({
    query: CART_CREATE_MUTATION,
    variables: {
      input: {
        lines: [
          {
            merchandiseId,
            quantity: 1,
          },
        ],
      },
    },
    revalidate: 0,
  });

  if (data.cartCreate.userErrors.length > 0) {
    return NextResponse.json(
      { errors: data.cartCreate.userErrors },
      { status: 400 },
    );
  }

  if (!data.cartCreate.cart) {
    return NextResponse.json(
      { error: "Shopify did not return a cart." },
      { status: 500 },
    );
  }

  return NextResponse.json(data.cartCreate.cart);
}
