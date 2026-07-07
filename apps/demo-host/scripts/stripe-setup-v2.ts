import Stripe from 'stripe';

async function setup() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const products = await stripe.products.list({
    limit: 10,
    active: true,
  });

  const existing = products.data.find(
    (p) => p.name === 'Soren Credits' ||
      p.metadata?.product === 'soren-fixes-it',
  );

  const productId = existing?.id;
  if (!productId) {
    console.error('Soren Credits product not found.');
    console.log('Run stripe-setup.ts first.');
    process.exit(1);
  }

  console.log('Found product:', productId);

  const aiPackagePrice = await stripe.prices.create({
    product: productId,
    unit_amount: 199,
    currency: 'usd',
    nickname: 'AI Package',
    metadata: {
      option: 'ai-package',
      product: 'soren-fixes-it',
    },
  });

  const doItForMePrice = await stripe.prices.create({
    product: productId,
    unit_amount: 900,
    currency: 'usd',
    nickname: 'Do It For Me',
    metadata: {
      option: 'do-it-for-me',
      product: 'soren-fixes-it',
    },
  });

  console.log('\n✅ New prices created:');
  console.log(`STRIPE_PRICE_AI_PACKAGE=${aiPackagePrice.id}`);
  console.log(`STRIPE_PRICE_DO_IT_FOR_ME=${doItForMePrice.id}`);
  console.log('\nAdd these to Railway now.');
}

setup().catch(console.error);
