import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { ProductModel } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    let systemMessage = `You are an expert Mesh Rider engineer and mesh networking specialist. Answer questions with concise technical details and calculations when appropriate.`;

    if (context.activeTool === 'range') {
      systemMessage += `\nUser is using the Range Calculator. Provide specific range calculations.`;
    } else if (context.activeTool === 'throughput') {
      systemMessage += `\nUser is using the Throughput Calculator. Provide throughput calculations.`;
    } else if (context.activeTool === 'logviewer' || context.activeTool === 'logviewer-analysis') {
      systemMessage += `\nUser is using the Log Viewer.`;
      if (context.logFileContent) {
        systemMessage += `\nLog data provided: ${context.logFileContent.substring(0, 500)}...`;
      }
    }

    if (context.productData) {
      systemMessage += `\nReference product specifications when relevant. Available products: ${JSON.stringify(context.productData.map((p: ProductModel) => ({ id: p.id, name: p.name, band: p.frequencyBand })))}`;
    }

    systemMessage += `\nProvide numerical answers with exact values when calculations are required.`;

    const apiMessages = [
      { role: 'system', content: systemMessage },
      ...messages.filter((m: { role: string, content: string }) => m.role === 'user' || m.role === 'assistant')
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 2000
    });

    const responseMessage = completion.choices[0].message;

    return NextResponse.json({ content: responseMessage.content });
  } catch (error) {
    console.error('Error processing chat request:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}