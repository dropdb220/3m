import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ stuNum: string }> }) {
    const { stuNum } = await params;

    if (!/[1|2]0[1-8][0-2][0-9]$/.test(stuNum)) {
        return NextResponse.json({ error: '다시 시도' }, { status: 400, headers: { 'Content-Type': 'application/json; charset=UTF-8' } });
    }

    const client = new MongoClient(process.env.MONGO!);
    try {
        await client.connect();
        const db = client.db('3m');
        const collection = db.collection('scores');

        const existingScore = await collection.findOne({ stuNum });
        if (existingScore) {
            return NextResponse.json({ score: existingScore.score });
        } else {
            await collection.insertOne({ stuNum, score: 0 });
            return NextResponse.json({ score: 0 });
        }
    } catch (e) {
        console.error('Database error:', e);
        return NextResponse.json({ error: '서버 오류' }, { status: 500, headers: { 'Content-Type': 'application/json; charset=UTF-8' } });
    }
}

export async function POST(request: Request, { params }: { params: Promise<{ stuNum: string }> }) {
    const { stuNum } = await params;
    const body = await request.json();

    if (request.headers.get('Authorization') !== process.env.PSK) {
        return NextResponse.json({ error: '인증 실패' }, { status: 403, headers: { 'Content-Type': 'application/json; charset=UTF-8' } });
    }

    if (!/[1|2]0[1-8][0-2][0-9]$/.test(stuNum)) {
        return NextResponse.json({ error: '다시 시도' }, { status: 400, headers: { 'Content-Type': 'application/json; charset=UTF-8' } });
    }

    const client = new MongoClient(process.env.MONGO!);
    try {
        await client.connect();
        const db = client.db('3m');
        const collection = db.collection('scores');

        const existingScore = await collection.findOne({ stuNum });
        if (existingScore) {
            await collection.updateOne({ stuNum }, { $inc: { score: body.score } });
            return NextResponse.json({});
        } else {
            await collection.insertOne({ stuNum, score: body.score });
            return NextResponse.json({});
        }
    } catch (e) {
        console.error('Database error:', e);
        return NextResponse.json({ error: '서버 오류' }, { status: 500, headers: { 'Content-Type': 'application/json; charset=UTF-8' } });
    }
}