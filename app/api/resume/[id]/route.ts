import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const resume = await prisma.resume.findUnique({
      where: { id },
    });

    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(resume);
  } catch (error: any) {
    console.error('Error fetching resume:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resume', message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const resume = await prisma.resume.update({
      where: { id },
      data: {
        content: body.content,
        title: body.title,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(resume);
  } catch (error: any) {
    console.error('Error updating resume:', error);
    return NextResponse.json(
      { error: 'Failed to update resume', message: error.message },
      { status: 500 }
    );
  }
}
