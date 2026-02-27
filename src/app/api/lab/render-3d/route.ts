import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const execAsync = promisify(exec);

export const runtime = "nodejs";
export const maxDuration = 60; // Blender rendering can take time

export async function POST(request: NextRequest) {
  const tempDir = "/tmp/blender-renders";
  let inputPath = "";
  let outputPath = "";

  try {
    const { roomData } = await request.json();

    if (!roomData) {
      return NextResponse.json({ error: "No room data provided" }, { status: 400 });
    }

    // Create temp directory
    await mkdir(tempDir, { recursive: true });

    // Generate unique filenames
    const uuid = randomUUID();
    inputPath = path.join(tempDir, `${uuid}-input.json`);
    outputPath = path.join(tempDir, `${uuid}-output.png`);

    // Write room data to temp file
    await writeFile(inputPath, JSON.stringify(roomData));

    // Get the script path
    const scriptPath = path.join(process.cwd(), "scripts", "render_room.py");

    // Run Blender in background mode
    const command = `blender --background --python "${scriptPath}" -- "${inputPath}" "${outputPath}" 2>&1`;
    
    console.log("Running Blender command:", command);
    
    const { stdout, stderr } = await execAsync(command, {
      timeout: 55000, // 55 second timeout
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for Blender output
    });

    console.log("Blender stdout:", stdout.slice(-500)); // Last 500 chars

    // Read the rendered image
    const imageBuffer = await readFile(outputPath);
    const base64Image = `data:image/png;base64,${imageBuffer.toString("base64")}`;

    // Cleanup temp files
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});

    return NextResponse.json({ image: base64Image });
  } catch (error: any) {
    console.error("Blender render error:", error);

    // Cleanup on error
    if (inputPath) await unlink(inputPath).catch(() => {});
    if (outputPath) await unlink(outputPath).catch(() => {});

    // Check for specific errors
    if (error.killed) {
      return NextResponse.json(
        { error: "Render timeout - try a smaller room" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to render 3D model" },
      { status: 500 }
    );
  }
}
