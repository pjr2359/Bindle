import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function GET() {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a flight data API that returns only JSON data."
        },
        {
          role: "user",
          content: "Generate 3 sample flights from NYC to LAX for tomorrow. Include airline, flight number, departure time, arrival time, and price in USD. Format as JSON."
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    return NextResponse.json({
      success: true,
      modelResponse: response.choices[0].message.content
    });
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}