import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { auth } from '@/auth';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { filename, contentType } = await req.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'Filename and contentType are required' }, { status: 400 });
    }

    // Sanitize filename and create a unique object key
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '');
    const objectKey = `avatars/${session.user.id}-${Date.now()}-${safeFilename}`;

    // Create a command to put the object in the S3 bucket
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: objectKey,
      ContentType: contentType,
    });

    // Generate a pre-signed URL for the PUT operation
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // URL expires in 1 hour
    });

    const publicUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${objectKey}`;

    return NextResponse.json({
      url: signedUrl,
      publicUrl: publicUrl
    });

  } catch (error) {
    console.error('Failed to create pre-signed URL:', error);
    return NextResponse.json({ error: 'Failed to create pre-signed URL' }, { status: 500 });
  }
} 