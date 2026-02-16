import crypto from "crypto";
import { NextResponse } from "next/server";

export async function POST(req: Request) {

  const body = await req.json();

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = body;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {

    return NextResponse.json({
      success: false,
    });

  }

  return NextResponse.json({
    success: true,
    paymentId: razorpay_payment_id,
  });

}
