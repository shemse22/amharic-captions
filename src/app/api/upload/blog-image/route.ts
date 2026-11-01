import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const blogImagesDir = path.join(process.cwd(), 'public', 'blog-images');
    if (!fs.existsSync(blogImagesDir)) {
      fs.mkdirSync(blogImagesDir, { recursive: true });
    }

    const formData = await req.formData();
    const file = (formData.get('image') || formData.get('file')) as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Verify MIME type is an image
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Uploaded file must be an image (JPEG, PNG, WebP, GIF, SVG, AVIF)' },
        { status: 400 }
      );
    }

    // Maximum 12MB limit for high-res blog covers
    if (file.size > 12 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Image size exceeds maximum limit of 12MB' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize extension and filename
    const ext = path.extname(file.name) || (file.type === 'image/png' ? '.png' : file.type === 'image/webp' ? '.webp' : '.jpg');
    const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40) || 'cover';
    const uniqueFileName = `${Date.now()}_${baseName}${ext}`;
    const filePath = path.join(blogImagesDir, uniqueFileName);

    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/blog-images/${uniqueFileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: uniqueFileName,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Blog image upload error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to upload blog image' },
      { status: 500 }
    );
  }
}

