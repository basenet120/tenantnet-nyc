import { NextRequest, NextResponse } from "next/server";
import { getSession, sessionBuildingId } from "@/lib/auth";
import { prisma } from "@/lib/db";

const BOROUGH_IDS: Record<string, string> = {
  manhattan: "1",
  bronx: "2",
  brooklyn: "3",
  queens: "4",
  staten_island: "5",
};

// NYC Open Data SODA API endpoints
const ENDPOINTS: Record<string, { url: string; idType: "bbl" | "bin" }> = {
  hpd_violations: {
    url: "https://data.cityofnewyork.us/resource/wvxf-dwi5.json",
    idType: "bbl",
  },
  hpd_complaints: {
    url: "https://data.cityofnewyork.us/resource/uwyv-629c.json",
    idType: "bbl",
  },
  dob_violations: {
    url: "https://data.cityofnewyork.us/resource/3h2n-5cm9.json",
    idType: "bin",
  },
  dob_complaints: {
    url: "https://data.cityofnewyork.us/resource/eabe-havv.json",
    idType: "bin",
  },
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

  // Special handler for rent stabilization unit counts
  if (type === "rent_stabilization") {
    return handleRentStabilization(buildingId);
  }

  if (!type || !ENDPOINTS[type]) {
    return NextResponse.json(
      { error: "Invalid type. Use: hpd_violations, hpd_complaints, dob_violations, dob_complaints, rent_stabilization" },
      { status: 400 },
    );
  }

  const building = await prisma.building.findUnique({
    where: { id: buildingId },
    select: { borough: true, block: true, lot: true, bin: true },
  });

  if (!building) {
    return NextResponse.json({ error: "Building not found" }, { status: 404 });
  }

  const endpoint = ENDPOINTS[type];
  const boroughId = BOROUGH_IDS[building.borough];
  let apiUrl: string;

  if (endpoint.idType === "bbl") {
    if (!boroughId || !building.block || !building.lot) {
      return NextResponse.json({ error: "Building missing BBL identifiers" }, { status: 400 });
    }
    const where = `boroid='${boroughId}' AND block='${building.block.padStart(5, "0")}' AND lot='${building.lot.padStart(4, "0")}'`;
    apiUrl = `${endpoint.url}?$where=${encodeURIComponent(where)}&$order=inspectiondate DESC&$limit=50`;

    if (type === "hpd_complaints") {
      const complaintsWhere = `boroid='${boroughId}' AND block='${building.block.padStart(5, "0")}' AND lot='${building.lot.padStart(4, "0")}'`;
      apiUrl = `${endpoint.url}?$where=${encodeURIComponent(complaintsWhere)}&$order=receiveddate DESC&$limit=50`;
    }
  } else {
    if (!building.bin) {
      return NextResponse.json({ error: "Building missing BIN identifier" }, { status: 400 });
    }
    if (type === "dob_violations") {
      apiUrl = `${endpoint.url}?$where=${encodeURIComponent(`bin='${building.bin}'`)}&$order=violation_date DESC&$limit=50`;
    } else {
      apiUrl = `${endpoint.url}?$where=${encodeURIComponent(`bin='${building.bin}'`)}&$order=date_entered DESC&$limit=50`;
    }
  }

  try {
    const res = await fetch(apiUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "NYC Open Data API error", status: res.status },
        { status: 502 },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
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

  // NYC Open Data: Rent Stabilization Unit Counts
  // Dataset: https://data.cityofnewyork.us/Housing-Development/Rent-Stabilization-Unit-Counts/tesw-yqqr
  const bbl = `${boroughId}${building.block.padStart(5, "0")}${building.lot.padStart(4, "0")}`;
  const apiUrl = `https://data.cityofnewyork.us/resource/tesw-yqqr.json?ucbbl=${bbl}&$order=uc2007 DESC&$limit=10`;

  try {
    const res = await fetch(apiUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!res.ok) {
      return NextResponse.json({
        buildingType: building.buildingType,
        unitCounts: null,
        message: "Could not fetch stabilization data from NYC Open Data.",
      });
    }

    const data = await res.json();
    return NextResponse.json({
      buildingType: building.buildingType,
      unitCounts: data.length > 0 ? data[0] : null,
      address: building.address,
    });
  } catch {
    return NextResponse.json({
      buildingType: building.buildingType,
      unitCounts: null,
      message: "Failed to connect to NYC Open Data.",
    });
  }
}
