import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  console.log("GET /api/simple-test called.");
  return NextResponse.json({ message: "Simple test API is working!" });
}