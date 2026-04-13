import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendBuildingSignupConfirmation } from "@/lib/email";

export async function POST(request: Request) {
  const body = await request.json();
  const { address, borough, zip, contactName, contactEmail, contactPhone, unitCount, message } = body as {
    address?: string;
    borough?: string;
    zip?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    unitCount?: number;
    message?: string;
  };

  if (!address?.trim() || !contactName?.trim() || !contactEmail?.trim()) {
    return NextResponse.json(
      { error: "Address, name, and email are required" },
      { status: 400 },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const signup = await prisma.buildingSignup.create({
    data: {
      address: address.trim(),
      borough: borough || null,
      zip: zip?.trim() || null,
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone?.trim() || null,
      unitCount: unitCount || null,
      message: message?.trim() || null,
    },
  });

  // Send confirmation email (fire-and-forget)
  sendBuildingSignupConfirmation(contactEmail.trim(), address.trim());

  return NextResponse.json({ id: signup.id });
}
