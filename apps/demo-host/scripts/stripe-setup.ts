import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRODUCT_METADATA_KEY = 'product';
const PRODUCT_METADATA_VALUE = 'soren-fixes-it';
const WEBHOOK_URL =
  'https://toolkit-demo-host-production-ac14.up.railway.app/api/credits/webhook';

async function findExistingProduct(): Promise<Stripe.Product | null> {
  const products = await stripe.products.list({ limit: 100, active: true });
  return (
    products.data.find(
      (p) => p.metadata[PRODUCT_METADATA_KEY] === PRODUCT_METADATA_VALUE,
    ) ?? null
  );
}

async function findPriceForProduct(
  productId: string,
  credits: string,
): Promise<Stripe.Price | null> {
  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 100,
  });
  return (
    prices.data.find((p) => p.metadata.credits === credits) ?? null
  );
}

async function setup() {
  console.log('Setting up Stripe products...');

  let product = await findExistingProduct();

  if (product) {
    console.log('Existing product found:', product.id);
  } else {
    product = await stripe.products.create({
      name: 'Soren Credits',
      description:
        'Credits for AI-powered GEO fixes by Soren. ' +
        '5 credits fixes one site.',
      metadata: { [PRODUCT_METADATA_KEY]: PRODUCT_METADATA_VALUE },
    });
    console.log('Product created:', product.id);
  }

  let price5 = await findPriceForProduct(product.id, '5');
  if (!price5) {
    price5 = await stripe.prices.create({
      product: product.id,
      unit_amount: 100,
      currency: 'usd',
      nickname: '5 Soren Credits',
      metadata: { credits: '5' },
    });
  }

  let price25 = await findPriceForProduct(product.id, '25');
  if (!price25) {
    price25 = await stripe.prices.create({
      product: product.id,
      unit_amount: 400,
      currency: 'usd',
      nickname: '25 Soren Credits',
      metadata: { credits: '25' },
    });
  }

  let price100 = await findPriceForProduct(product.id, '100');
  if (!price100) {
    price100 = await stripe.prices.create({
      product: product.id,
      unit_amount: 1200,
      currency: 'usd',
      nickname: '100 Soren Credits',
      metadata: { credits: '100' },
    });
  }

  const existingWebhooks = await stripe.webhookEndpoints.list({ limit: 100 });
  let webhook = existingWebhooks.data.find((w) => w.url === WEBHOOK_URL);

  if (!webhook) {
    webhook = await stripe.webhookEndpoints.create({
      url: WEBHOOK_URL,
      enabled_events: ['checkout.session.completed'],
      description: 'Soren Credits — checkout complete',
    });
    console.log('Webhook endpoint created');
  } else {
    console.log('Existing webhook endpoint found:', webhook.id);
  }

  console.log('\n✅ Stripe setup complete.');
  console.log('\nAdd these to Railway environment:');
  console.log(`STRIPE_PRICE_5=${price5.id}`);
  console.log(`STRIPE_PRICE_25=${price25.id}`);
  console.log(`STRIPE_PRICE_100=${price100.id}`);
  console.log(`STRIPE_PRODUCT_ID=${product.id}`);
  console.log(`\nSTRIPE_WEBHOOK_SECRET=${webhook.secret}`);
  console.log('\nCopy all values above to Railway.');
}

setup().catch((err) => {
  console.error(err);
  process.exit(1);
});
