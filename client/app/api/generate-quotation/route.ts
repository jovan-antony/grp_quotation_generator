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
      let errorMessage = 'Failed to generate quotation from backend';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.error || errorMessage;
      } catch (e) {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      console.error('Python API error:', errorMessage);
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating quotation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate quotation' },
      { status: 500 }
    );
  }
}
