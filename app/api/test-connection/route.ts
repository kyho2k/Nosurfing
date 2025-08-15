import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  console.log("GET /api/test-connection called (simplified version).");
  return NextResponse.json({ message: "Test connection API reached (simplified)" });
}
