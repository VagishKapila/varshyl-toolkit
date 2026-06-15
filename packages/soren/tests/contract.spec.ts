import { describe, expect, it, vi } from 'vitest';
import { buildSorenSkills, runSorenJob } from '../src/server';
import { createReferenceAdapter, SorenMemoryStore } from '../src/reference';

describe('buildSorenSkills', () => {
  it('emits one tool per implemented verb, in canonical order', () => {
    const tools = buildSorenSkills(createReferenceAdapter());
    expect(tools.map((t) => t.name)).toEqual(['find', 'attach', 'create', 'file', 'delete']);
  });

  it('fills JSON-Schema enums from adapter capabilities', () => {
    const tools = buildSorenSkills(createReferenceAdapter());
    const find = tools.find((t) => t.name === 'find');
    const props = find?.input_schema.properties as Record<string, { enum?: string[] }>;
    expect(find?.input_schema.required).toContain('type');
    expect(props.type.enum).toContain('photo');
  });

  it('execute() runs the verb, publishes the card, and returns spoken text', async () => {
    const store = new SorenMemoryStore([{ type: 'photo', title: 'rebar', createdAt: Date.now() }]);
    const tools = buildSorenSkills(createReferenceAdapter({ store }));
    const find = tools.find((t) => t.name === 'find');
    const publishCard = vi.fn();

    const speech = await runSorenJob({ productId: 'soren-demo', now: new Date(), publishCard }, () =>
      find!.execute({ type: 'photo', when: 'all' }),
    );

    expect(speech).toMatch(/Found 1 photo/);
    expect(publishCard).toHaveBeenCalledTimes(1);
    expect(publishCard.mock.calls[0][0]).toMatchObject({ kind: 'result' });
  });

  it('converts an unexpected throw into graceful speech (never goes silent)', async () => {
    const broken = {
      productId: 'x',
      capabilities: { find: { types: ['photo'] } },
      find: () => {
        throw new Error('boom');
      },
    };
    const tools = buildSorenSkills(broken as never);
    const publishCard = vi.fn();
    const speech = await runSorenJob({ productId: 'x', now: new Date(), publishCard }, () =>
      tools[0].execute({ type: 'photo' }),
    );
    expect(speech).toMatch(/problem/i);
    expect(publishCard).toHaveBeenCalledTimes(1);
  });

  it('throws a clear error if no job context is active', async () => {
    const tools = buildSorenSkills(createReferenceAdapter());
    await expect(tools[0].execute({ type: 'photo' })).rejects.toThrow(/job context/);
  });
});
