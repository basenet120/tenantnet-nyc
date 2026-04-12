import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getSession } from "@/lib/auth";
import { IMAGE_LIMITS } from "@/lib/constants";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!IMAGE_LIMITS.acceptedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Accepted: jpeg, png, webp" },
      { status: 400 },
    );
  }

  if (file.size > IMAGE_LIMITS.maxSizeBytes) {
    return NextResponse.json(
      { error: "File too large. Max size: 10MB" },
      { status: 400 },
    );
  }

  const blob = await put(file.name, file, { access: "public" });

  return NextResponse.json({ url: blob.url });
}
