import { createSorenRouter } from '@varshylinc/soren-screen/server';
import { JOBSITE_QA, jobsiteConfig } from '@varshylinc/soren-screen/adapters/jobsite';

export function createSorenDemoRouter() {
  return createSorenRouter({
    productId: jobsiteConfig.productId,
    qaRegistry: { [jobsiteConfig.productId]: JOBSITE_QA },
  });
}
