import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const timestamp = new Date().toISOString()
  
  console.log(`[Health Check] ${timestamp}`)
  
  return NextResponse.json({
    status: 'healthy',
    timestamp,
    runtime: 'nodejs',
    version: process.version,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_RUNTIME: process.env.NEXT_RUNTIME,
    }
  })
}