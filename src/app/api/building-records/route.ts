import { NextRequest, NextResponse } from "next/server";
import { getSession, sessionBuildingId } from "@/lib/auth";
import { prisma } from "@/lib/db";

const BOROUGH_NAMES: Record<string, string> = {
  manhattan: "MANHATTAN",
  bronx: "BRONX",
  brooklyn: "BROOKLYN",
  queens: "QUEENS",
  staten_island: "STATEN ISLAND",
};

const BOROUGH_IDS: Record<string, string> = {
  manhattan: "1",
  bronx: "2",
  brooklyn: "3",
  queens: "4",
  staten_island: "5",
};

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const buildingId = sessionBuildingId(session);
  if (!buildingId) {
    return NextResponse.json({ error: "No building context" }, { status: 400 });
  }

  const type = req.nextUrl.searchParams.get("type");
  if (!type) {
    return NextResponse.json({ error: "Missing type parameter" }, { status: 400 });
  }

  if (type === "rent_stabilization") {
    return handleRentStabilization(buildingId);
  }

  const building = await prisma.building.findUnique({
    where: { id: buildingId },
    select: { borough: true, block: true, lot: true, bin: true },
  });

  if (!building) {
    return NextResponse.json({ error: "Building not found" }, { status: 404 });
  }

  const boroughName = BOROUGH_NAMES[building.borough];
  let apiUrl: string;

  try {
    switch (type) {
      case "hpd_violations": {
        // Dataset: wvxf-dwi5 — HPD Violations
        // Columns: boroid (number), block (string, unpadded), lot (string, unpadded)
        const boroughId = BOROUGH_IDS[building.borough];
        if (!boroughId || !building.block || !building.lot) {
          return NextResponse.json({ error: "Building missing BBL identifiers" }, { status: 400 });
        }
        const where = `boroid='${boroughId}' AND block='${building.block}' AND lot='${building.lot}'`;
        apiUrl = `https://data.cityofnewyork.us/resource/wvxf-dwi5.json?$where=${encodeURIComponent(where)}&$order=inspectiondate DESC&$limit=50`;
        break;
      }

      case "hpd_complaints": {
        // Dataset: ygpa-z7cr — HPD Complaints and Problems (public, replaces uwyv-629c)
        // Columns: borough (text name like "MANHATTAN"), block (string), lot (string)
        if (!boroughName || !building.block || !building.lot) {
          return NextResponse.json({ error: "Building missing BBL identifiers" }, { status: 400 });
        }
        const where = `borough='${boroughName}' AND block='${building.block}' AND lot='${building.lot}'`;
        apiUrl = `https://data.cityofnewyork.us/resource/ygpa-z7cr.json?$where=${encodeURIComponent(where)}&$order=received_date DESC&$limit=50`;
        break;
      }

      case "dob_violations": {
        // Dataset: 3h2n-5cm9 — DOB Violations
        // Columns: bin (string), issue_date (YYYYMMDD string)
        if (!building.bin) {
          return NextResponse.json({ error: "Building missing BIN identifier" }, { status: 400 });
        }
        apiUrl = `https://data.cityofnewyork.us/resource/3h2n-5cm9.json?$where=${encodeURIComponent(`bin='${building.bin}'`)}&$order=issue_date DESC&$limit=50`;
        break;
      }

      case "dob_complaints": {
        // Dataset: eabe-havv — DOB Complaints Received
        // Columns: bin (string), date_entered (MM/DD/YYYY string)
        if (!building.bin) {
          return NextResponse.json({ error: "Building missing BIN identifier" }, { status: 400 });
        }
        apiUrl = `https://data.cityofnewyork.us/resource/eabe-havv.json?$where=${encodeURIComponent(`bin='${building.bin}'`)}&$order=date_entered DESC&$limit=50`;
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const res = await fetch(apiUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`NYC Open Data error for ${type}:`, res.status, body.slice(0, 300));
      return NextResponse.json(
        { error: "NYC Open Data API error" },
        { status: 502 },
      );
    }

    const data = await res.json();

    // Check for SODA error responses
    if (data && typeof data === "object" && "error" in data && !Array.isArray(data)) {
      console.error(`NYC Open Data SODA error for ${type}:`, JSON.stringify(data).slice(0, 300));
      return NextResponse.json(
        { error: data.message || "NYC Open Data query error" },
        { status: 502 },
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error(`Failed to fetch ${type}:`, err);
    return NextResponse.json(
      { error: "Failed to fetch from NYC Open Data" },
      { status: 502 },
    );
  }
}

async function handleRentStabilization(buildingId: string) {
  const building = await prisma.building.findUnique({
    where: { id: buildingId },
    select: { borough: true, block: true, lot: true, buildingType: true, address: true },
  });

  if (!building) {
    return NextResponse.json({ error: "Building not found" }, { status: 404 });
  }

  const boroughId = BOROUGH_IDS[building.borough];
  if (!boroughId || !building.block || !building.lot) {
    return NextResponse.json({
      buildingType: building.buildingType,
      unitCounts: null,
      message: "Building missing BBL identifiers — cannot look up stabilization counts.",
    });
  }

  // Dataset: tesw-yqqr — HPD Registrations (includes rent stabilization info)
  // Query by boroid/block/lot (not BBL composite)
  const where = `boroid=${boroughId} AND block='${building.block}' AND lot='${building.lot}'`;
  const apiUrl = `https://data.cityofnewyork.us/resource/tesw-yqqr.json?$where=${encodeURIComponent(where)}&$limit=1`;

  try {
    const res = await fetch(apiUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      return NextResponse.json({
        buildingType: building.buildingType,
        unitCounts: null,
        message: "Could not fetch registration data from NYC Open Data.",
      });
    }

    const data = await res.json();
    return NextResponse.json({
      buildingType: building.buildingType,
      registration: data.length > 0 ? data[0] : null,
      address: building.address,
    });
  } catch {
    return NextResponse.json({
      buildingType: building.buildingType,
      registration: null,
      message: "Failed to connect to NYC Open Data.",
    });
  }
}
