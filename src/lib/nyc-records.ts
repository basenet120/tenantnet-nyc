type BuildingInfo = {
  borough: string;
  block?: string | null;
  lot?: string | null;
  bin?: string | null;
  address?: string;
  hpdBuildingId?: string | null;
};

type RecordUrl = {
  recordType: string;
  url: string;
  label: string;
  description: string;
};

const BOROUGH_IDS: Record<string, string> = {
  manhattan: "1",
  bronx: "2",
  brooklyn: "3",
  queens: "4",
  staten_island: "5",
};

/**
 * Look up HPD's internal building ID from NYC Open Data.
 * This ID is needed for HPD Online deep links.
 */
export async function lookupHpdBuildingId(
  borough: string,
  block: string,
  lot: string,
): Promise<string | null> {
  const boroughId = BOROUGH_IDS[borough];
  if (!boroughId) return null;

  try {
    const where = `boroid=${boroughId} AND block='${block}' AND lot='${lot}'`;
    const url = `https://data.cityofnewyork.us/resource/tesw-yqqr.json?$where=${encodeURIComponent(where)}&$limit=1&$select=buildingid`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0]?.buildingid ?? null;
  } catch {
    return null;
  }
}

export function generateBuildingRecordUrls(building: BuildingInfo): RecordUrl[] {
  const records: RecordUrl[] = [];
  const boroughId = BOROUGH_IDS[building.borough];
  const hpdBid = building.hpdBuildingId;

  // DOB records — link to DOB NOW search (hash URLs don't deep-link reliably)
  if (building.bin) {
    const dobSearchUrl = `https://a810-dobnow.nyc.gov/Publish/Index.html#!/search/${building.bin}`;
    records.push({
      recordType: "dob_profile",
      url: dobSearchUrl,
      label: "DOB Building Profile",
      description: "NYC Department of Buildings property overview, permits, and certificates of occupancy",
    });
    records.push({
      recordType: "dob_violations",
      url: dobSearchUrl,
      label: "DOB Violations",
      description: "Environmental Control Board violations and penalties",
    });
    records.push({
      recordType: "dob_complaints",
      url: dobSearchUrl,
      label: "DOB Complaints",
      description: "Building complaints filed with the Department of Buildings",
    });
  }

  // HPD records — use HPD building ID for deep links when available
  if (hpdBid) {
    records.push({
      recordType: "hpd_violations",
      url: `https://hpdonline.nyc.gov/hpdonline/building/${hpdBid}/violations`,
      label: "HPD Violations",
      description: "Housing Preservation & Development violations for housing code issues",
    });
    records.push({
      recordType: "hpd_complaints",
      url: `https://hpdonline.nyc.gov/hpdonline/building/${hpdBid}/complaints`,
      label: "HPD Complaints",
      description: "Housing complaints filed with HPD",
    });
    records.push({
      recordType: "hpd_registration",
      url: `https://hpdonline.nyc.gov/hpdonline/building/${hpdBid}/overview`,
      label: "HPD Registration",
      description: "Building registration, owner information, and rent stabilization status",
    });
  } else if (boroughId && building.block && building.lot) {
    // Fallback: link to HPD Online search
    const hpdSearch = `https://hpdonline.nyc.gov/hpdonline/building/${boroughId}/${building.block}/${building.lot}/overview`;
    records.push({
      recordType: "hpd_violations",
      url: hpdSearch,
      label: "HPD Violations",
      description: "Housing Preservation & Development violations for housing code issues",
    });
    records.push({
      recordType: "hpd_complaints",
      url: hpdSearch,
      label: "HPD Complaints",
      description: "Housing complaints filed with HPD",
    });
    records.push({
      recordType: "hpd_registration",
      url: hpdSearch,
      label: "HPD Registration",
      description: "Building registration, owner information, and rent stabilization status",
    });
  }

  // Property records (ACRIS + ZoLa) — BBL-based, these work reliably
  if (boroughId && building.block && building.lot) {
    records.push({
      recordType: "acris",
      url: `https://a836-acris.nyc.gov/bblsearch/bblsearch.asp?borough=${boroughId}&block=${building.block}&lot=${building.lot}`,
      label: "ACRIS Property Records",
      description: "Deeds, mortgages, and other property documents",
    });
    records.push({
      recordType: "zola",
      url: `https://zola.planning.nyc.gov/lot/${boroughId}/${building.block}/${building.lot}`,
      label: "NYC Zoning (ZoLa)",
      description: "Zoning and land use information from NYC Planning",
    });
  }

  if (building.address) {
    records.push({
      recordType: "nyc_311",
      url: `https://portal.311.nyc.gov/article/?kanession=search&q=${encodeURIComponent(building.address)}`,
      label: "NYC 311 Complaints",
      description: "311 service requests and complaints for this address",
    });
  }

  return records;
}
