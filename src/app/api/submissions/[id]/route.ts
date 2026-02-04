import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get user ID from session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Find the submission and verify ownership
    const submission = await prisma.submission.findUnique({
      where: { 
        id: params.id,
        userId: user.id // Ensure user owns this submission
      },
      include: {
        form: {
          include: {
            publication: {
              include: {
                organization: true
              }
            }
          }
        },
        submissionFiles: {
          orderBy: {
            uploadedAt: 'desc'
          }
        },
        decision: true,
        reviews: {
          include: {
            user: {
              select: {
                name: true,
                id: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })
    
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }
    
    return NextResponse.json({ submission })
    
  } catch (error) {
    console.error('Get submission error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch submission' 
    }, { status: 500 })
  }
}