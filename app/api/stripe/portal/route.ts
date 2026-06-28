import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getTenant } from "@/lib/tenant";

export async function POST(req: NextRequest) {
  try {
    const { org, role } = await getTenant();

    if (role !== "OWNER") {
      return NextResponse.json(
        { error: "Only owners can manage billing" },
        { status: 403 }
      );
    }

    if (!org.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing account found" },
        { status: 400 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/usage`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}