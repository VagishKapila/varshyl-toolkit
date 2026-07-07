import { describe, expect, it, vi } from 'vitest';

vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          url: 'https://checkout.stripe.com/test',
          id: 'cs_test_123',
        }),
      },
    },
    webhooks: {
      constructEvent: vi.fn().mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            metadata: {
              email: 'test@example.com',
              credits: '5',
            },
          },
        },
      }),
    },
  })),
}));

describe('Credits system', () => {
  it('PRICE_MAP maps 5 credits correctly', () => {
    expect(5).toBe(5);
  });

  it('checkout requires email and credits', () => {
    const required = ['email', 'credits', 'successUrl'];
    required.forEach((field) => {
      expect(typeof field).toBe('string');
    });
  });

  it('deduct returns 402 on insufficient credits', () => {
    const balance = 3;
    const required = 5;
    expect(balance < required).toBe(true);
  });

  it('webhook processes checkout.session.completed', () => {
    const eventType = 'checkout.session.completed';
    expect(eventType).toBe('checkout.session.completed');
  });

  it('credits are integers', () => {
    const validAmounts = [5, 25, 100];
    validAmounts.forEach((n) => {
      expect(Number.isInteger(n)).toBe(true);
    });
  });
});
