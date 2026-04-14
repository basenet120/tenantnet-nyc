import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/db";
import { getSession, sessionBuildingId } from "@/lib/auth";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.type !== "unit" && session.type !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const buildingId = sessionBuildingId(session);
  if (!buildingId) {
    return NextResponse.json({ error: "No building context" }, { status: 400 });
  }

  const body = await request.json();
  const { to, subject, message } = body as {
    to?: string;
    subject?: string;
    message?: string;
  };

  if (!to?.trim() || !subject?.trim() || !message?.trim()) {
    return NextResponse.json(
      { error: "Recipient, subject, and message are required" },
      { status: 400 },
    );
  }

  // Validate email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim())) {
    return NextResponse.json({ error: "Invalid recipient email" }, { status: 400 });
  }

  // Get building info and tenant rep for reply-to
  const building = await prisma.building.findUnique({
    where: { id: buildingId },
    select: { name: true, address: true, replyEmail: true },
  });

  if (!building) {
    return NextResponse.json({ error: "Building not found" }, { status: 404 });
  }

  // Find the tenant rep for this building to use as reply-to
  const tenantRep = await prisma.admin.findFirst({
    where: { buildingId, role: "tenant_rep" },
    select: { email: true, name: true },
  });

  const replyTo = tenantRep?.email ?? (session.type === "admin" ? session.email : undefined);
  const fromAddress = building.replyEmail
    ? `${building.name} via TENANTNET.NYC <${building.replyEmail}>`
    : `${building.name} via TENANTNET.NYC <notifications@tenantnet.nyc>`;

  // Identify the sender and their email (to CC them on the outgoing report)
  let senderLabel: string;
  let senderEmail: string | null = null;
  if (session.type === "admin") {
    senderLabel = session.name ?? session.email;
    senderEmail = session.email;
  } else {
    senderLabel = `Unit ${session.unitLabel}`;
    const unit = await prisma.unit.findUnique({
      where: { id: session.unitId },
      select: { email: true, firstName: true, lastName: true },
    });
    if (unit?.email) {
      senderEmail = unit.email;
      const name = [unit.firstName, unit.lastName].filter(Boolean).join(" ");
      if (name) senderLabel = `${name} (Unit ${session.unitLabel})`;
    }
  }

  // Build CC list: sender + tenant rep (if sender is a tenant, to keep building org in the loop)
  const ccList: string[] = [];
  if (senderEmail) ccList.push(senderEmail);
  if (
    session.type === "unit" &&
    tenantRep?.email &&
    tenantRep.email.toLowerCase() !== senderEmail?.toLowerCase()
  ) {
    ccList.push(tenantRep.email);
  }

  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping report email");
    return NextResponse.json({ error: "Email service not configured" }, { status: 503 });
  }

  try {
    await resend.emails.send({
      from: fromAddress,
      to: to.trim(),
      cc: ccList.length > 0 ? ccList : undefined,
      replyTo: replyTo,
      subject: subject.trim(),
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background-color:#ffffff;color:#1a1a1a;font-family:system-ui,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
    <div style="border-bottom:2px solid #c45d3e;padding-bottom:12px;margin-bottom:24px;">
      <h1 style="margin:0;font-size:16px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;color:#1a1a1a;">
        ${building.name}
      </h1>
      <p style="margin:4px 0 0;font-size:12px;color:#666;">${building.address} &mdash; via TENANTNET.NYC</p>
    </div>
    <div style="font-size:15px;line-height:1.7;color:#1a1a1a;white-space:pre-wrap;">${message.trim()}</div>
    <div style="margin-top:32px;border-top:1px solid #ddd;padding-top:16px;">
      <p style="margin:0;font-size:12px;color:#999;">
        Sent by ${senderLabel} at ${building.name}.<br>
        ${ccList.length > 0 ? `CC: <strong>${ccList.join(", ")}</strong><br>` : ""}
        ${replyTo ? `Reply to this email — responses go to <strong>${replyTo}</strong> and the people on CC.` : ""}
      </p>
    </div>
  </div>
</body>
</html>`.trim(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[email] Failed to send report:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
