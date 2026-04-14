type BuildingInfo = {
  borough: string;
  block?: string | null;
  lot?: string | null;
  bin?: string | null;
  address?: string;
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

export function generateBuildingRecordUrls(building: BuildingInfo): RecordUrl[] {
  const records: RecordUrl[] = [];
  const boroughId = BOROUGH_IDS[building.borough];

  if (building.bin) {
    records.push({
      recordType: "dob_profile",
      url: `https://a810-dobnow.nyc.gov/Publish/#!/BISProfile/${building.bin}/1`,
      label: "DOB Building Profile",
      description: "NYC Department of Buildings property overview, permits, and certificates of occupancy",
    });
    records.push({
      recordType: "dob_violations",
      url: `https://a810-dobnow.nyc.gov/Publish/#!/BISProfile/${building.bin}/2`,
      label: "DOB Violations",
      description: "Environmental Control Board violations and penalties",
    });
    records.push({
      recordType: "dob_complaints",
      url: `https://a810-dobnow.nyc.gov/Publish/#!/BISProfile/${building.bin}/3`,
      label: "DOB Complaints",
      description: "Building complaints filed with the Department of Buildings",
    });
  }

  if (boroughId && building.block && building.lot) {
    records.push({
      recordType: "hpd_violations",
      url: `https://hpdonline.nyc.gov/hpdonline/building/${boroughId}/${building.block}/${building.lot}/violations`,
      label: "HPD Violations",
      description: "Housing Preservation & Development violations for housing code issues",
    });
    records.push({
      recordType: "hpd_complaints",
      url: `https://hpdonline.nyc.gov/hpdonline/building/${boroughId}/${building.block}/${building.lot}/complaints`,
      label: "HPD Complaints",
      description: "Housing complaints filed with HPD",
    });
    records.push({
      recordType: "hpd_registration",
      url: `https://hpdonline.nyc.gov/hpdonline/building/${boroughId}/${building.block}/${building.lot}/overview`,
      label: "HPD Registration",
      description: "Building registration, owner information, and rent stabilization status",
    });
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
