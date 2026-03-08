import { NextRequest, NextResponse } from 'next/server';
import { getFastAPIUrl } from '../utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      creatorId,
      title,
      description,
      price,
      maxDurationDays,
      coverImage,
      isExam,
      institution,
      subject,
      topics,
      examExamples,
      availableTools,
      flashcardQuestions,
      generateSummaries,
      additionalComments,
      geminiModel,
    } = body;

    if (!creatorId || !title || !description || price === undefined || !topics) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Llamar al backend FastAPI
    const response = await fetch(getFastAPIUrl('/api/create-course'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creator_id: creatorId,
        title,
        description,
        price: parseFloat(price),
        max_duration_days: maxDurationDays || null,
        cover_image: coverImage || null,
        is_exam: isExam || false,
        institution: institution || null,
        subject: subject || null,
        topics,
        exam_examples: examExamples || [],
        available_tools: availableTools || {},
        flashcard_questions: flashcardQuestions || [],
        generate_summaries: generateSummaries || false,
        additional_comments: additionalComments || null,
        gemini_model: geminiModel || "gemini-3-pro",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Error al crear curso' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error creating course:', error);
    const message = error instanceof Error ? error.message : 'Error al crear curso';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

