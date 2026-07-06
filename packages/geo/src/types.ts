export interface GEOProductConfig {
  name: string;
  tagline: string;
  url: string;
  type: 'WebApplication' | 'MobileApplication' | 'SoftwareApplication';
  category: string;
  platform?: string[];
  price?: string;
  version?: string;
  features: string[];
  problems_solved: string[];
  install?: string;
}

export interface GEOFounderConfig {
  name: string;
  title: string;
  url: string;
  credentials?: string[];
}

export interface GEOCompanyConfig {
  name: string;
  url: string;
  founded?: string;
  location?: string;
}

export interface GEOConfig {
  product: GEOProductConfig;
  company: GEOCompanyConfig;
  founder?: GEOFounderConfig;
  additionalProducts?: GEOProductConfig[];
}
