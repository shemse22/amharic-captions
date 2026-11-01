import { NextRequest, NextResponse } from 'next/server';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { Readable } from 'stream';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  if (!/^[a-zA-Z0-9_-]+\.mp4$/.test(filename)) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  const filePath = path.join(uploadsDir, filename);
  let fileStat;

  try {
    fileStat = await stat(filePath);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }
    throw error;
  }

  if (!fileStat.isFile()) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }

  const headers = new Headers({
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Content-Type': 'video/mp4',
  });
  const rangeHeader = request.headers.get('range');

  if (!rangeHeader) {
    headers.set('Content-Length', fileStat.size.toString());
    const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream<Uint8Array>;
    return new NextResponse(stream, { headers });
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
  if (!match || (!match[1] && !match[2])) {
    headers.set('Content-Range', `bytes */${fileStat.size}`);
    return new NextResponse(null, { status: 416, headers });
  }

  const requestedStart = match[1] ? Number(match[1]) : null;
  const requestedEnd = match[2] ? Number(match[2]) : null;
  const start = requestedStart ?? Math.max(0, fileStat.size - (requestedEnd ?? 0));
  const end = requestedStart === null
    ? fileStat.size - 1
    : Math.min(requestedEnd ?? fileStat.size - 1, fileStat.size - 1);

  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < 0 ||
    end < start ||
    start >= fileStat.size
  ) {
    headers.set('Content-Range', `bytes */${fileStat.size}`);
    return new NextResponse(null, { status: 416, headers });
  }

  headers.set('Content-Length', (end - start + 1).toString());
  headers.set('Content-Range', `bytes ${start}-${end}/${fileStat.size}`);
  const stream = Readable.toWeb(createReadStream(filePath, { start, end })) as ReadableStream<Uint8Array>;

  return new NextResponse(stream, { status: 206, headers });
}
