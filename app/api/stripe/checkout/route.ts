import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { org, userId } = await getTenant();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

    let customerId = org.stripeCustomerId;

    if (!customerId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      const customer = await stripe.customers.create({
        email: user?.email ?? undefined,
        name: user?.name ?? undefined,
        metadata: { orgId: org.id },
      });

      customerId = customer.id;

      await prisma.organization.update({
        where: { id: org.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
      success_url: `${appUrl}/dashboard/usage?upgraded=true`,
      cancel_url: `${appUrl}/dashboard/usage?canceled=true`,
      metadata: { orgId: org.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}