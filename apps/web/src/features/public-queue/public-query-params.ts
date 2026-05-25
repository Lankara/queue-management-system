export const POSTGRES_UUID_TEXT_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export interface PublicQueueQueryParams {
  branchId: string | null;
  serviceId: string | null;
  invalidBranchId: boolean;
  invalidServiceId: boolean;
}

export function getPublicQueueQueryParams(searchParams: URLSearchParams): PublicQueueQueryParams {
  const rawBranchId = searchParams.get('branchId');
  const rawServiceId = searchParams.get('serviceId');
  const branchId = rawBranchId && POSTGRES_UUID_TEXT_PATTERN.test(rawBranchId) ? rawBranchId : null;
  const serviceId = rawServiceId && POSTGRES_UUID_TEXT_PATTERN.test(rawServiceId) ? rawServiceId : null;

  return {
    branchId,
    serviceId,
    invalidBranchId: Boolean(rawBranchId && !branchId),
    invalidServiceId: Boolean(rawServiceId && !serviceId)
  };
}

export function buildPublicQueueQueryString(params: Pick<PublicQueueQueryParams, 'branchId' | 'serviceId'>): string {
  const searchParams = new URLSearchParams();
  if (params.branchId) searchParams.set('branchId', params.branchId);
  if (params.serviceId) searchParams.set('serviceId', params.serviceId);
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}
