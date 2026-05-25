import { Branch, Business, Service } from './business-setup';

export type PublicQrLinkOptionType = 'business' | 'branch' | 'service' | 'branch-service';

export interface QrLinkContext {
  business: Business;
  branch?: Branch | null;
  service?: Service | null;
  publicAppUrl: string;
}

export interface PublicQrLinkOption {
  type: PublicQrLinkOptionType;
  label: string;
  description: string;
  url: string;
  branch?: Branch | null;
  service?: Service | null;
  filename: string;
}
