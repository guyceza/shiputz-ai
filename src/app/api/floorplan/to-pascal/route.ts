import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Editor3D is disabled" }, { status: 404 });
}
