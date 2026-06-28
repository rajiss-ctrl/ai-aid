import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { STRIPE_PRICE_TO_PLAN } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS } from "@/lib/tenant";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = sub.metadata.orgId;
        const priceId = sub.items.data[0]?.price.id;
        const plan = STRIPE_PRICE_TO_PLAN[priceId] ?? "FREE";

        await prisma.organization.update({
          where: { id: orgId },
          data: {
            plan,
            stripeSubId: sub.id,
            tokenLimit: PLAN_LIMITS[plan],
            tokensUsed: 0,
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await prisma.organization.update({
          where: { id: sub.metadata.orgId },
          data: {
            plan: "FREE",
            stripeSubId: null,
            tokenLimit: PLAN_LIMITS.FREE,
          },
        });
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const org = await prisma.organization.findUnique({
          where: { stripeCustomerId: invoice.customer as string },
        });
        if (org) {
          await prisma.organization.update({
            where: { id: org.id },
            data: { tokensUsed: 0 },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
}