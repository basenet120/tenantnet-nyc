import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const BOROUGH_CODES: Record<string, string> = {
  manhattan: "MN",
  bronx: "BX",
  brooklyn: "BK",
  queens: "QN",
  staten_island: "SI",
};

/**
 * Look up Block/Lot/BIN from a NYC address using the PLUTO dataset on NYC Open Data.
 * Returns the correct BBL identifiers for the building.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.type !== "admin" || session.role !== "system_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { address, borough } = await req.json();
  if (!address || !borough) {
    return NextResponse.json({ error: "Address and borough required" }, { status: 400 });
  }

  const boroughCode = BOROUGH_CODES[borough];
  if (!boroughCode) {
    return NextResponse.json({ error: "Invalid borough" }, { status: 400 });
  }

  // Normalize address: "449 West 125th Street" → "449 WEST 125 STREET"
  const normalized = address
    .toUpperCase()
    .replace(/(\d+)(ST|ND|RD|TH)\b/g, "$1")  // Remove ordinal suffixes
    .replace(/\bSTREET\b/g, "STREET")
    .replace(/\bAVENUE\b/g, "AVENUE")
    .replace(/\bBOULEVARD\b/g, "BOULEVARD")
    .replace(/\bDRIVE\b/g, "DRIVE")
    .replace(/\bPLACE\b/g, "PLACE")
    .trim();

  // Query PLUTO dataset (64uk-42ks) for matching address
  const where = `address='${normalized}' AND borough='${boroughCode}'`;
  const apiUrl = `https://data.cityofnewyork.us/resource/64uk-42ks.json?$where=${encodeURIComponent(where)}&$limit=1&$select=bbl,block,lot,address,borough,numfloors,unitsres,unitstotal,yearbuilt`;

  try {
    const res = await fetch(apiUrl, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "NYC Open Data error" }, { status: 502 });
    }

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      // Try a looser search — just house number and street
      const parts = normalized.match(/^(\d+[-\d]*)\s+(.+)$/);
      if (parts) {
        const looseWhere = `starts_with(address, '${parts[1]}') AND borough='${boroughCode}'`;
        const looseUrl = `https://data.cityofnewyork.us/resource/64uk-42ks.json?$where=${encodeURIComponent(looseWhere)}&$limit=5&$select=bbl,block,lot,address,borough`;
        const looseRes = await fetch(looseUrl, { headers: { Accept: "application/json" } });
        if (looseRes.ok) {
          const looseData = await looseRes.json();
          // Find best match by checking if the street name is in the result
          const streetWords = parts[2].split(/\s+/).filter((w: string) => w.length > 2);
          const match = looseData.find((r: Record<string, string>) =>
            streetWords.every((w: string) => r.address?.includes(w))
          );
          if (match) {
            return NextResponse.json(formatResult(match));
          }
        }
      }

      return NextResponse.json({ error: "Address not found in PLUTO. Check the address and borough." }, { status: 404 });
    }

    const result = formatResult(data[0]);

    // Look up BIN from HPD registrations (tesw-yqqr) using block/lot
    const boroughId = { MN: "1", BX: "2", BK: "3", QN: "4", SI: "5" }[boroughCode];
    if (boroughId && result.block && result.lot) {
      try {
        const hpdWhere = `boroid=${boroughId} AND block='${result.block}' AND lot='${result.lot}'`;
        const hpdUrl = `https://data.cityofnewyork.us/resource/tesw-yqqr.json?$where=${encodeURIComponent(hpdWhere)}&$limit=1&$select=bin`;
        const hpdRes = await fetch(hpdUrl, { headers: { Accept: "application/json" } });
        if (hpdRes.ok) {
          const hpdData = await hpdRes.json();
          if (hpdData.length > 0 && hpdData[0].bin) {
            result.bin = hpdData[0].bin;
          }
        }
      } catch {
        // BIN lookup is best-effort
      }
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to look up address" }, { status: 502 });
  }
}

function formatResult(row: Record<string, string>): Record<string, string | number | null> {
  return {
    block: row.block,
    lot: row.lot,
    bin: null,
    bbl: row.bbl?.replace(/\..*/, "") ?? null,
    address: row.address,
    yearBuilt: row.yearbuilt ? parseInt(row.yearbuilt) : null,
    totalUnits: row.unitstotal ? parseInt(row.unitstotal) : null,
    numFloors: row.numfloors ? Math.round(parseFloat(row.numfloors)) : null,
  };
}
