import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    await prisma.$connect(); // Test DB connection
    return NextResponse.json({ message: 'Database connection successful!' });
  } catch (error) {
    return NextResponse.json({ error: 'Database connection failed', details: error }, { status: 500 });
  }
}