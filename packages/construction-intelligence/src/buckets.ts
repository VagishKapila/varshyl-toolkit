import type {
  PhotoCountBucket,
  CrewSizeBucket,
  WeatherCondition,
  CompletionStatus,
} from './types';

export function photoCountBucket(n: number): PhotoCountBucket {
  if (n === 0)  return '0';
  if (n <= 3)   return '1-3';
  if (n <= 10)  return '4-10';
  return '11+';
}

export function crewSizeBucket(n: number): CrewSizeBucket {
  if (n <= 2)  return '1-2';
  if (n <= 5)  return '3-5';
  if (n <= 10) return '6-10';
  return '11+';
}

export function classifyWeather(text: string): WeatherCondition {
  const t = text.toLowerCase();
  if (/heavy rain|downpour|thunderstorm/.test(t)) return 'heavy_rain';
  if (/rain|drizzle|wet/.test(t))                 return 'rain';
  if (/snow|ice|frost/.test(t))                   return 'snow';
  if (/fog|mist/.test(t))                         return 'fog';
  if (/overcast|cloud/.test(t))                   return 'cloudy';
  if (/partly cloud|mostly clear/.test(t))        return 'partly_cloudy';
  if (/clear|sunny|fair/.test(t))                 return 'clear';
  return 'unknown';
}

export function classifyStage(text: string): CompletionStatus {
  const t = text.toLowerCase();
  if (/roof framing|roofing/.test(t))                        return 'roof_framing';
  if (/drywall|sheetrock|gypsum/.test(t))                    return 'drywall';
  if (/mep|mechanical|electrical|plumbing|rough.in/.test(t)) return 'mep_rough_in';
  if (/upper floor|second floor|upper framing/.test(t))      return 'framing_upper';
  if (/framing|lumber|stud/.test(t))                         return 'framing';
  if (/slab|pour|concrete/.test(t))                          return 'slab';
  if (/foundation|footing|excavat/.test(t))                  return 'foundation';
  if (/site prep|grading|clearing/.test(t))                  return 'site_prep';
  if (/finish|punch|trim|paint/.test(t))                     return 'finishing';
  return 'unknown';
}

export function classifyFlags(text: string) {
  const t = text.toLowerCase();
  return {
    delay_flag:
      /delay|behind schedule|weather hold|stop work|idle/.test(t),
    safety_flag:
      /\bsafety\b|\bincident\b|\binjury\b|\bosha\b|\bppe\b|\bhazard\b/.test(t),
    deviation_flag:
      /change order|rfi|deviation|scope change|not per plan/.test(t),
  };
}
