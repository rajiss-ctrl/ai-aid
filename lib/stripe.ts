// lib/stripe.ts
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
  typescript: true,
});

export const PLAN_TO_PRICE: Record<string, string> = {
  PRO: process.env.STRIPE_PRO_PRICE_ID!,
};

export const STRIPE_PRICE_TO_PLAN: Record<string, "FREE" | "PRO" | "ENTERPRISE"> = {
  [process.env.STRIPE_PRO_PRICE_ID!]: "PRO",
};

export const PLAN_LIMITS = {
  FREE: 10000,
  PRO: 500000,
  ENTERPRISE: 10000000,
} as const;

export type Plan = keyof typeof PLAN_LIMITS;

export function getTokenLimit(plan: Plan): number {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;
}

export function getPlanFromPriceId(priceId: string): Plan {
  return STRIPE_PRICE_TO_PLAN[priceId] || "FREE";
}