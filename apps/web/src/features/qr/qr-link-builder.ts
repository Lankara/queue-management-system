import { Branch, Business, Service } from '@/types/business-setup';
import { PublicQrLinkOption } from '@/types/qr';

export function getPublicAppUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_PUBLIC_APP_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return 'http://localhost:3000';
}

export function buildPublicQueueLink(publicAppUrl: string, businessSlug: string, branchId?: string | null, serviceId?: string | null): string {
  const url = new URL(`/q/${businessSlug}`, publicAppUrl);
  if (branchId) url.searchParams.set('branchId', branchId);
  if (serviceId) url.searchParams.set('serviceId', serviceId);
  return url.toString();
}

export function buildQrFilename(businessSlug: string, branch?: Branch | null, service?: Service | null): string {
  const parts = ['queue-qr', businessSlug];
  if (branch?.code) parts.push(slugifyFilePart(branch.code));
  if (service?.code) parts.push(slugifyFilePart(service.code));
  return `${parts.join('-')}.png`;
}

export function buildQrLinkOptions(business: Business, branches: Branch[], services: Service[], publicAppUrl: string): PublicQrLinkOption[] {
  const activeBranches = branches.filter((branch) => branch.isActive);
  const activeServices = services.filter((service) => service.isActive);
  const options: PublicQrLinkOption[] = [
    {
      type: 'business',
      label: 'Business QR',
      description: 'General public queue link for this business.',
      url: buildPublicQueueLink(publicAppUrl, business.slug),
      branch: null,
      service: null,
      filename: buildQrFilename(business.slug)
    }
  ];

  for (const branch of activeBranches) {
    options.push({
      type: 'branch',
      label: branch.name,
      description: `Branch-specific link for ${branch.code}.`,
      url: buildPublicQueueLink(publicAppUrl, business.slug, branch.id),
      branch,
      service: null,
      filename: buildQrFilename(business.slug, branch)
    });
  }

  for (const service of activeServices) {
    options.push({
      type: 'service',
      label: service.name,
      description: `Service-specific link for ${service.code}.`,
      url: buildPublicQueueLink(publicAppUrl, business.slug, null, service.id),
      branch: null,
      service,
      filename: buildQrFilename(business.slug, null, service)
    });
  }

  for (const branch of activeBranches) {
    for (const service of activeServices) {
      if (service.branchId && service.branchId !== branch.id) continue;
      options.push({
        type: 'branch-service',
        label: `${branch.name} - ${service.name}`,
        description: `Combined branch and service link for ${branch.code} / ${service.code}.`,
        url: buildPublicQueueLink(publicAppUrl, business.slug, branch.id, service.id),
        branch,
        service,
        filename: buildQrFilename(business.slug, branch, service)
      });
    }
  }

  return options;
}

function slugifyFilePart(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
