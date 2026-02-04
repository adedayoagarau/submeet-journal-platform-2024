import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import crypto from 'crypto'

// Configure R2 client
const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const submissionId = formData.get('submissionId') as string
    const fieldId = formData.get('fieldId') as string
    const fileType = formData.get('fileType') as string || 'manuscript'
    
    if (!file || !submissionId || !fieldId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Verify user owns the submission
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        form: {
          include: {
            fields: true
          }
        }
      }
    })
    
    if (!submission || submission.userId !== user.id) {
      return NextResponse.json({ error: 'Submission not found or unauthorized' }, { status: 404 })
    }
    
    // Validate file type and size
    const maxFileSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxFileSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 })
    }
    
    // Validate file type
    const allowedMimeTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/pdf',
      'text/plain',
      'application/rtf',
      'application/vnd.oasis.opendocument.text'
    ]
    
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Accepted: .doc, .docx, .pdf, .txt, .rtf, .odt' }, { status: 400 })
    }
    
    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const uniqueId = crypto.randomBytes(16).toString('hex')
    const fileName = `${submissionId}_${fieldId}_${uniqueId}.${fileExtension}`
    const filePath = `submissions/${submissionId}/${fileName}`
    
    // Calculate file hash for duplicate detection
    const fileBuffer = await file.arrayBuffer()
    const fileHash = crypto.createHash('sha256').update(Buffer.from(fileBuffer)).digest('hex')
    
    // Check for duplicate files (same hash)
    const existingFile = await prisma.submissionFile.findFirst({
      where: {
        submissionId,
        fileHash
      }
    })
    
    if (existingFile) {
      return NextResponse.json({ error: 'This file has already been uploaded for this submission' }, { status: 400 })
    }
    
    // Upload to R2
    const uploadParams = {
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: filePath,
      Body: Buffer.from(fileBuffer),
      ContentType: file.type,
      ContentLength: file.size,
    }
    
    await r2Client.send(new PutObjectCommand(uploadParams))
    
    // Save file record to database
    const submissionFile = await prisma.submissionFile.create({
      data: {
        submissionId,
        fileName,
        originalName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type,
        filePath,
        fileHash,
        fileType: fileType as any,
      }
    })
    
    // Generate presigned URL for file access (optional)
    const presignedUrl = await getSignedUrl(
      r2Client,
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: filePath,
      }),
      { expiresIn: 3600 } // 1 hour
    )
    
    return NextResponse.json({ 
      success: true,
      file: {
        id: submissionFile.id,
        fileName: submissionFile.fileName,
        originalName: submissionFile.originalName,
        fileSizeBytes: submissionFile.fileSizeBytes,
        mimeType: submissionFile.mimeType,
        fileType: submissionFile.fileType,
        uploadedAt: submissionFile.uploadedAt,
      },
      downloadUrl: `${process.env.R2_PUBLIC_URL}/${filePath}`
    })
    
  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json({ 
      error: 'Failed to upload file' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')
    const submissionId = searchParams.get('submissionId')
    
    if (!fileId || !submissionId) {
      return NextResponse.json({ error: 'Missing fileId or submissionId' }, { status: 400 })
    }
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Verify user owns the submission
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    const submissionFile = await prisma.submissionFile.findFirst({
      where: {
        id: fileId,
        submissionId: submissionId,
        submission: {
          userId: user.id
        }
      }
    })
    
    if (!submissionFile) {
      return NextResponse.json({ error: 'File not found or unauthorized' }, { status: 404 })
    }
    
    // Generate presigned URL for download
    const downloadUrl = await getSignedUrl(
      r2Client,
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: submissionFile.filePath,
      }),
      { expiresIn: 3600 } // 1 hour
    )
    
    return NextResponse.json({ 
      downloadUrl,
      file: {
        id: submissionFile.id,
        originalName: submissionFile.originalName,
        fileSizeBytes: submissionFile.fileSizeBytes,
        mimeType: submissionFile.mimeType,
      }
    })
    
  } catch (error) {
    console.error('Get file error:', error)
    return NextResponse.json({ 
      error: 'Failed to get file' 
    }, { status: 500 })
  }
}