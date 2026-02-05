import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../../../lib/auth"
import { prisma } from "../../../../../lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { reason } = await request.json()
    
    // Get user ID from session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Find the submission and verify ownership
    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
      include: {
        form: {
          include: {
            publication: true
          }
        }
      }
    })
    
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }
    
    if (submission.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Only allow withdrawal for pending or under_review submissions
    if (!['pending', 'under_review'].includes(submission.status)) {
      return NextResponse.json({ 
        error: 'Cannot withdraw submission that has already been decided' 
      }, { status: 400 })
    }
    
    // Update submission status
    const updatedSubmission = await prisma.submission.update({
      where: { id: params.id },
      data: {
        status: 'withdrawn',
        withdrawalReason: reason || 'Writer requested withdrawal',
        withdrawnAt: new Date()
      }
    })
    
    // Send withdrawal notification to publication (would integrate with email service)
    // await sendWithdrawalNotification(submission.form.publication, submission)
    
    return NextResponse.json({ 
      success: true,
      submission: {
        id: updatedSubmission.id,
        status: updatedSubmission.status,
        withdrawnAt: updatedSubmission.withdrawnAt,
        withdrawalReason: updatedSubmission.withdrawalReason
      }
    })
    
  } catch (error) {
    console.error('Withdrawal error:', error)
    return NextResponse.json({ 
      error: 'Failed to withdraw submission' 
    }, { status: 500 })
  }
}