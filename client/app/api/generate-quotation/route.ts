import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward all data to Python FastAPI backend
    const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:8000';

    const response = await fetch(`${fastApiUrl}/generate-quotation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Python API error:', errorText);
      throw new Error('Failed to generate quotation from backend');
    }

    const docxBlob = await response.blob();

    return new NextResponse(docxBlob, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="quotation.docx"',
      },
    });
  } catch (error) {
    console.error('Error generating quotation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate quotation' },
      { status: 500 }
    );
  }
}
