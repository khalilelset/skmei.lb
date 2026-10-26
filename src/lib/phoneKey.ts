/**
 * Canonical form of a Lebanese phone number for matching records that were saved in
 * different formats: "+96171867784", "96171867784", "0096171867784", "71867784" and
 * "03 123 456" all reduce to the local digits without the country code or leading 0.
 */
export function phoneKey(raw: unknown): string {
  let d = String(raw ?? '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('961')) d = d.slice(3);
  return d.replace(/^0+/, '');
}
