import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { 
      formId, 
      title, 
      subtitle, 
      genre, 
      wordCount, 
      language, 
      isTranslation, 
      originalLanguage,
      translatorName,
      coverLetter, 
      authorBio 
    } = body
    
    if (!formId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Get user ID from session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Verify form exists and is active
    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: {
        publication: true
      }
    })
    
    if (!form || !form.isActive) {
      return NextResponse.json({ error: 'Form not found or inactive' }, { status: 404 })
    }
    
    // Check if submission cap is reached
    if (form.submissionCap && form.currentSubmissionCount >= form.submissionCap) {
      return NextResponse.json({ error: 'Submission cap reached' }, { status: 400 })
    }
    
    // Check if reading period is open
    const now = new Date()
    if (form.readingPeriodStart && now < form.readingPeriodStart) {
      return NextResponse.json({ error: 'Reading period has not started' }, { status: 400 })
    }
    
    if (form.readingPeriodEnd && now > form.readingPeriodEnd) {
      return NextResponse.json({ error: 'Reading period has ended' }, { status: 400 })
    }
    
    // Create submission
    const submission = await prisma.submission.create({
      data: {
        formId,
        userId: user.id,
        title,
        subtitle,
        genre,
        wordCount,
        language: language || 'English',
        isTranslation: isTranslation || false,
        originalLanguage,
        translatorName,
        coverLetter,
        authorBio,
        status: 'pending'
      },
      include: {
        form: {
          include: {
            publication: true
          }
        },
        user: true
      }
    })
    
    // Increment submission count
    await prisma.form.update({
      where: { id: formId },
      data: {
        currentSubmissionCount: {
          increment: 1
        }
      }
    })
    
    // Send confirmation email (would integrate with email service)
    // await sendSubmissionConfirmation(user.email, submission)
    
    return NextResponse.json({ 
      success: true, 
      submission: {
        id: submission.id,
        title: submission.title,
        status: submission.status,
        submittedAt: submission.submittedAt,
        publication: submission.form.publication.name
      }
    })
    
  } catch (error) {
    console.error('Submission creation error:', error)
    return NextResponse.json({ 
      error: 'Failed to create submission' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get user's submissions
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    const submissions = await prisma.submission.findMany({
      where: { userId: user.id },
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
        submissionFiles: true,
        decision: true
      },
      orderBy: {
        submittedAt: 'desc'
      },
      take: 50 // Limit for now
    })
    
    return NextResponse.json({ submissions })
    
  } catch (error) {
    console.error('Get submissions error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch submissions' 
    }, { status: 500 })
  }
}