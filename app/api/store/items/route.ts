import fs from 'node:fs';
import path from 'node:path';
import { MongoClient } from 'mongodb';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const stuNum = request.nextUrl.searchParams.get('stuNum') || '';

    if (!/[1|2]0[1-8][0-2][0-9]$/.test(stuNum)) {
        return new Response(JSON.stringify({ error: '다시 시도' }), { status: 400, headers: { 'Content-Type': 'application/json; charset=UTF-8' } });
    }

    const client = new MongoClient(process.env.MONGO!);
    try {
        await client.connect();
        const db = client.db('3m');
        const collection = db.collection('goods');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pastItems: any = await collection.findOne({ stuNum }) || {};

        const dirPath = path.join(process.cwd(), 'data', 'goods');
        const goods = (await fs.promises.readdir(dirPath)).filter(x => !x.startsWith('.')).map(async good => {
            try {
                const metadata = JSON.parse(await fs.promises.readFile(path.join(dirPath, good, 'info.json'), 'utf8'));
                return {
                    id: good,
                    name: metadata.name,
                    category: metadata.category,
                    remaining: Math.min(3 - (pastItems[metadata.category] || 0), metadata.max - ((await collection.findOne({ goodId: good })) || { totalCnt: 0 }).totalCnt),
                    price: metadata.price
                }
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
                return null;
            }
        })
        const goods2 = await Promise.all(goods);
        client.close();
        return new Response(JSON.stringify(goods2.filter(item => item !== null)));
    } catch (e) { console.log(e) }
}