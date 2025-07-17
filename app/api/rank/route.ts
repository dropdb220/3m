import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const client = new MongoClient(process.env.MONGO!);
    try {
        await client.connect();
        const db = client.db('3m');
        const collection = db.collection('scores');

        const scores = await collection.find({}).toArray();
        client.close();
        const sortedScores = scores.sort((a, b) => (b.score + (b.spent || 0)) - (a.score + (a.spent || 0))).slice(0, 5).map(score => {
            return {
                stuNum: score.stuNum,
                score: score.score + (score.spent || 0)
            }
        });
        return NextResponse.json(sortedScores, { headers: { 'Content-Type': 'application/json; charset=UTF-8' } });
    } catch (e) {
        console.error('Database error:', e);
        return NextResponse.json({ error: '서버 오류' }, { status: 500, headers: { 'Content-Type': 'application/json; charset=UTF-8' } });
    }
}