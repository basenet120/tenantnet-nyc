import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import sharp from "sharp";
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

  // Compress image with sharp: resize to max 1920px wide, convert to JPEG at 75% quality
  let compressed: Buffer;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    compressed = await sharp(buffer)
      .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 75, mozjpeg: true })
      .toBuffer();
  } catch {
    return NextResponse.json(
      { error: "Failed to process image. The file may be corrupted." },
      { status: 422 },
    );
  }

  const filename = file.name.replace(/\.[^.]+$/, "") + ".jpg";

  const blob = await put(`uploads/${Date.now()}-${filename}`, compressed, {
    access: "public",
    contentType: "image/jpeg",
  });

  return NextResponse.json({ url: blob.url });
}
