import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const checkpointDir = 'E:/CyberFed AI/artifacts/global';
    
    // Check if directory exists
    try {
      await fs.access(checkpointDir);
    } catch {
      return NextResponse.json([]); // Return empty list if no checkpoints directory exists yet
    }
    
    const files = await fs.readdir(checkpointDir);
    
    const checkpointFiles = [];
    for (const file of files) {
      if (file.endsWith('.pkl')) {
        const filePath = path.join(checkpointDir, file);
        const stats = await fs.stat(filePath);
        checkpointFiles.push({
          filename: file,
          sizeBytes: stats.size,
          lastModified: stats.mtime.toISOString(),
          path: filePath
        });
      }
    }
    
    // Sort checkpoints by filename or last modified descending
    checkpointFiles.sort((a, b) => b.lastModified.localeCompare(a.lastModified));
    
    return NextResponse.json(checkpointFiles);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
