import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  console.log("GET /api/env-check called.");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "NOT_SET";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "NOT_SET";

  return NextResponse.json({
    message: "Environment variables check",
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
    NODE_ENV: process.env.NODE_ENV || "NOT_SET",
  });
}