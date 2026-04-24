// src/routes/billing.js
const express = require("express");
const { db, admin, Collections } = require("../config");
const { verifyToken } = require("../middleware/auth");
const router = express.Router();

const PLANS = {
  starter:    { name:"Starter",    limit:10,  price: process.env.STRIPE_PRICE_STARTER },
  growth:     { name:"Growth",     limit:50,  price: process.env.STRIPE_PRICE_GROWTH },
  enterprise: { name:"Enterprise", limit:9999,price: process.env.STRIPE_PRICE_ENTERPRISE },
};

// ── POST /api/billing/create-session (Stripe Checkout) ────────
router.post("/create-session", verifyToken, async (req, res, next) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ error: "Billing not configured" });
    }
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const { plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ error: "Invalid plan" });
    const compSnap = await db.collection(Collections.COMPANIES).doc(req.companyId).get();
    const company  = compSnap.data();

    const session = await stripe.checkout.sessions.create({
      mode:       "subscription",
      payment_method_types: ["card"],
      customer_email: company.email,
      line_items: [{ price: PLANS[plan].price, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/dashboard?upgraded=true`,
      cancel_url:  `${process.env.FRONTEND_URL}/settings?billing=cancelled`,
      metadata: { companyId: req.companyId, plan },
    });
    res.json({ url: session.url });
  } catch(err){ next(err); }
});

// ── POST /api/billing/webhook (Stripe events) ─────────────────
router.post("/webhook", async (req, res) => {
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return res.status(400).send("Webhook signature failed");
  }

  if (event.type === "checkout.session.completed") {
    const session   = event.data.object;
    const companyId = session.metadata.companyId;
    const plan      = session.metadata.plan;
    await db.collection(Collections.COMPANIES).doc(companyId).update({
      plan,
      interviewsLimit:    PLANS[plan]?.limit || 10,
      stripeCustomerId:   session.customer,
      stripeSubscription: session.subscription,
      updatedAt:          admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  res.json({ received: true });
});

// ── GET /api/billing/plans ────────────────────────────────────
router.get("/plans", (req, res) => {
  res.json({ plans: [
    { id:"starter",    name:"Starter",    price:29,  limit:10,  features:["10 interviews/mo","1 job posting","Email notifications","Basic evaluation"] },
    { id:"growth",     name:"Growth",     price:79,  limit:50,  features:["50 interviews/mo","5 job postings","Custom questions","Work assignment","CSV export"] },
    { id:"enterprise", name:"Enterprise", price:199, limit:9999,features:["Unlimited interviews","Unlimited postings","White-label","API access","Priority support"] },
  ]});
});

module.exports = router;
