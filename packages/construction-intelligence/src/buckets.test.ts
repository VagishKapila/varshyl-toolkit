import { describe, it, expect } from 'vitest';
import {
  photoCountBucket,
  crewSizeBucket,
  classifyWeather,
  classifyStage,
  classifyFlags,
} from './buckets';

describe('photoCountBucket', () => {
  it('0 photos',  () => expect(photoCountBucket(0)).toBe('0'));
  it('3 photos',  () => expect(photoCountBucket(3)).toBe('1-3'));
  it('5 photos',  () => expect(photoCountBucket(5)).toBe('4-10'));
  it('12 photos', () => expect(photoCountBucket(12)).toBe('11+'));
});

describe('crewSizeBucket', () => {
  it('crew 2',  () => expect(crewSizeBucket(2)).toBe('1-2'));
  it('crew 4',  () => expect(crewSizeBucket(4)).toBe('3-5'));
  it('crew 8',  () => expect(crewSizeBucket(8)).toBe('6-10'));
  it('crew 15', () => expect(crewSizeBucket(15)).toBe('11+'));
});

describe('classifyWeather', () => {
  it('heavy rain', () =>
    expect(classifyWeather('heavy rain on site')).toBe('heavy_rain'));
  it('clear',      () =>
    expect(classifyWeather('clear sunny morning')).toBe('clear'));
  it('unknown',    () =>
    expect(classifyWeather('no mention')).toBe('unknown'));
});

describe('classifyStage', () => {
  it('framing_upper', () =>
    expect(classifyStage('framing upper floor')).toBe('framing_upper'));
  it('drywall',       () =>
    expect(classifyStage('drywall installation')).toBe('drywall'));
  it('unknown',       () =>
    expect(classifyStage('nothing here')).toBe('unknown'));
});

describe('classifyFlags', () => {
  it('delay',     () =>
    expect(classifyFlags('weather hold and delay').delay_flag).toBe(true));
  it('safety',    () =>
    expect(classifyFlags('osha safety inspection').safety_flag).toBe(true));
  it('deviation', () =>
    expect(classifyFlags('change order submitted').deviation_flag).toBe(true));
  it('no false positive on upper/ppe regression', () => {
    const flags = classifyFlags(
      'framing upper floor, lumber delivery, crew of four on site, clear weather'
    );
    expect(flags.delay_flag).toBe(false);
    expect(flags.safety_flag).toBe(false);
    expect(flags.deviation_flag).toBe(false);
  });
});
