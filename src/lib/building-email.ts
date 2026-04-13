/**
 * Generates a unique building email address from the street address and zip.
 * e.g. "449 West 125th Street" + "10027" → "449w125th10027rep@tenantnet.nyc"
 */
export function generateBuildingEmail(address: string, zip: string): string {
  const local = address
    .toLowerCase()
    .replace(/street|avenue|boulevard|drive|place|road|lane|court/gi, "")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20); // keep it reasonable length

  return `${local}${zip}rep@tenantnet.nyc`;
}
