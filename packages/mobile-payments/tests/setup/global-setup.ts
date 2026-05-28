export default async function setup() {
  if (!process.env.DATABASE_URL) {
    console.warn('[mobile-payments tests] DATABASE_URL not set — integration tests skipped');
  }
}
