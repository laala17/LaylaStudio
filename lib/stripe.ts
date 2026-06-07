import Stripe from "stripe"

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable")
  }

  // Use latest API version — Stripe SDK manages this
  stripeInstance = new Stripe(secretKey, {
    typescript: true,
  })

  return stripeInstance
}
