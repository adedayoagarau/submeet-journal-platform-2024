import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // For now, just return a basic health check
    // We'll add database connection test once we fix the Prisma setup
    return NextResponse.json({
      status: 'healthy',
      database: 'configured',
      timestamp: new Date().toISOString(),
      message: 'Submeet platform is running!'
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}