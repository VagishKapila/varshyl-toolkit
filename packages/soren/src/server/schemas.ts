import type { SorenVerbName } from '../verbs';
import type { SorenCapabilities } from './adapter';

type JsonSchema = Record<string, unknown>;

function enumOrString(values: readonly string[] | undefined, description: string): JsonSchema {
  const base: JsonSchema = { type: 'string', description };
  if (values && values.length) base.enum = [...values];
  return base;
}

const WHEN_SCHEMA: JsonSchema = {
  type: 'string',
  description: 'Time window, e.g. "today", "yesterday", "this_week", "all".',
};

/** JSON Schema for a verb's input, with enums filled from `capabilities`. */
export function verbInputSchema(verb: SorenVerbName, caps: SorenCapabilities): JsonSchema {
  switch (verb) {
    case 'find':
      return {
        type: 'object',
        properties: {
          type: enumOrString(caps.find?.types, 'What kind of items to find.'),
          when: WHEN_SCHEMA,
          filter: { type: 'string', description: 'Optional free-text filter.' },
          limit: { type: 'number', description: 'Max items to return (default 20).' },
        },
        required: ['type'],
      };
    case 'attach':
      return {
        type: 'object',
        properties: {
          mediaType: enumOrString(caps.attach?.mediaTypes, 'photo | video | document | file.'),
          note: { type: 'string', description: 'Optional note describing the attachment.' },
          source: { type: 'string', description: 'camera | gallery | upload.' },
          target: { type: 'object', description: 'Optional record to attach to.' },
          mediaIds: { type: 'array', items: { type: 'string' }, description: 'Ids of known media.' },
        },
        required: ['mediaType'],
      };
    case 'create':
      return {
        type: 'object',
        properties: {
          recordType: enumOrString(caps.create?.recordTypes, 'Kind of record to create.'),
          fields: { type: 'object', description: 'Field values for the new record.' },
        },
        required: ['recordType', 'fields'],
      };
    case 'file':
      return {
        type: 'object',
        properties: {
          entryType: enumOrString(caps.file?.entryTypes, 'log | invoice | …'),
          payload: { type: 'object', description: 'The entry contents.' },
          when: WHEN_SCHEMA,
        },
        required: ['entryType', 'payload'],
      };
    case 'delete':
      return {
        type: 'object',
        properties: {
          recordType: enumOrString(caps.delete?.recordTypes, 'Kind of record to delete.'),
          id: { type: 'string', description: 'Exact record id, if known.' },
          query: { type: 'string', description: 'Free-text to resolve the target.' },
          confirmed: { type: 'boolean', description: 'Advisory: set by a tapped confirm card.' },
        },
      };
  }
}

const BASE_DESCRIPTIONS: Record<SorenVerbName, string> = {
  find: 'Read-only search for the user\u2019s items. Returns a spoken summary and a card.',
  attach: 'Attach a photo, video, document, or file, optionally to a record.',
  create: 'Create a new record from the given fields.',
  file: 'File an entry such as a daily log or invoice.',
  delete: 'Delete a record. Always confirmed via a card before the destructive step.',
};

/** Tool description, with the capability vocabulary appended for grounding. */
export function verbDescription(verb: SorenVerbName, caps: SorenCapabilities): string {
  const base = BASE_DESCRIPTIONS[verb];
  const vocab =
    (verb === 'find' && caps.find?.types) ||
    (verb === 'attach' && caps.attach?.mediaTypes) ||
    (verb === 'create' && caps.create?.recordTypes) ||
    (verb === 'file' && caps.file?.entryTypes) ||
    (verb === 'delete' && caps.delete?.recordTypes) ||
    undefined;
  return vocab && vocab.length ? `${base} Supports: ${vocab.join(', ')}.` : base;
}
