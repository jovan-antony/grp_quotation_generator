import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const fastApiUrl = process.env.FASTAPI_URL || (process.env.NODE_ENV === 'production' ? 'http://backend:8000' : 'http://localhost:8000');

    const response = await fetch(`${fastApiUrl}/preview-quotation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error('Failed to generate preview from backend');
    }

    const htmlPreview = await response.text();

    return NextResponse.json({ html: htmlPreview });
  } catch (error) {
    console.error('Error generating preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    );
  }
}
