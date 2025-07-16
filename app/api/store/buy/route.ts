import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const body = await request.json();
    if (!/[1|2]0[1-8][0-2][0-9]$/.test(body.stuNum) || !body.id || !body.count || !body.merchantCode || body.merchantCode.length < 1) {
        return NextResponse.json({ error: '다시 시도' }, { status: 400, headers: { 'Content-Type': 'application/json; charset=UTF-8' } });
    }

    const client = new MongoClient(process.env.MONGO!);
    try {
        await client.connect();
        const db = client.db('3m');
        const scoresCollection = db.collection('scores');
        const goodsCollection = db.collection('goods');

        const score = await scoresCollection.findOne({ stuNum: body.stuNum });
        if (!score) {
            return NextResponse.json({ error: '잔액 부족' }, { status: 404, headers: { 'Content-Type': 'application/json; charset=UTF-8' } });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pastItems: any = await goodsCollection.findOne({ stuNum: body.stuNum }) || {};
        const dirPath = path.join(process.cwd(), 'data', 'goods');
        const goods = (await fs.promises.readdir(dirPath)).filter(x => !x.startsWith('.')).map(async good => {
            try {
                const metadata = JSON.parse(await fs.promises.readFile(path.join(dirPath, good, 'info.json'), 'utf8'));
                return {
                    id: good,
                    name: metadata.name,
                    category: metadata.category,
                    remaining: Math.min(3 - (pastItems[metadata.category] || 0), metadata.max - ((await goodsCollection.findOne({ goodId: good })) || { totalCnt: 0 }).totalCnt),
                    price: metadata.price
                }
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
                return null;
            }
        })
        const items = await Promise.all(goods);
        if (!items) return NextResponse.json({ error: '서버 오류' }, { status: 500, headers: { 'Content-Type': 'application/json; charset=UTF-8' } });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const item = items.find((i: any) => i.id === body.id);
        if (!item) {
            return NextResponse.json({ error: '유효하지 않은 상품' }, { status: 404, headers: { 'Content-Type': 'application/json; charset=UTF-8' } });
        }
        if (item.remaining < body.count) {
            return NextResponse.json({ error: '수량 상한 초과' }, { status: 400, headers: { 'Content-Type': 'application/json; charset=UTF-8' } });
        }
        if (score.score < item.price * body.count) {
            return NextResponse.json({ error: '잔액 부족' }, { status: 400, headers: { 'Content-Type': 'application/json; charset=UTF-8' } });
        }

        await scoresCollection.updateOne({ stuNum: body.stuNum }, { $inc: { score: -item.price * body.count } });
        const increase = {};
        Object.defineProperty(increase, item.category, { value: body.count, enumerable: true });
        await goodsCollection.updateOne({ stuNum: body.stuNum }, { $inc: increase }, { upsert: true });
        await goodsCollection.updateOne({ goodId: item.id }, { $inc: { totalCnt: body.count } }, { upsert: true });
        client.close();
        await fetch(`http://localhost:${process.env.WS_HTTP_PORT}/purchase?stuNum=${body.stuNum}&id=${body.id}&name=${item.name}&count=${body.count}&merchant=${body.merchantCode}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': process.env.PSK || ''
            }
        });
        return NextResponse.json({ id: body.id, count: body.count, balance: score.score - item.price * body.count }, { headers: { 'Content-Type': 'application/json; charset=UTF-8' } });
    } catch (e) {
        console.error('Database error:', e);
        return NextResponse.json({ error: '서버 오류' }, { status: 500, headers: { 'Content-Type': 'application/json; charset=UTF-8' } });
    }
}

export async function DELETE(request: Request) {
    const body = await request.json();
    if (request.headers.get('Authorization') !== process.env.PSK) {
        return NextResponse.json({ error: '인증 실패' }, { status: 403, headers: { 'Content-Type': 'application/json; charset=UTF-8' } });
    }
    if (!/[1|2]0[1-8][0-2][0-9]$/.test(body.stuNum) || !body.id || !body.count) {
        return NextResponse.json({ error: '다시 시도' }, { status: 400, headers: { 'Content-Type': 'application/json; charset=UTF-8' } });
    }

    const client = new MongoClient(process.env.MONGO!);
    try {
        await client.connect();
        const db = client.db('3m');
        const scoresCollection = db.collection('scores');
        const goodsCollection = db.collection('goods');

        const DBItem = await goodsCollection.findOne({ goodId: body.id });
        if (!DBItem) {
            return NextResponse.json({ error: '유효하지 않은 상품' }, { status: 404, headers: { 'Content-Type': 'application/json; charset=UTF-8' } });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pastItems: any = await goodsCollection.findOne({ stuNum: body.stuNum }) || {};
        const dirPath = path.join(process.cwd(), 'data', 'goods');
        const goods = (await fs.promises.readdir(dirPath)).filter(x => !x.startsWith('.')).map(async good => {
            try {
                const metadata = JSON.parse(await fs.promises.readFile(path.join(dirPath, good, 'info.json'), 'utf8'));
                return {
                    id: good,
                    name: metadata.name,
                    category: metadata.category,
                    remaining: Math.min(3 - (pastItems[metadata.category] || 0), metadata.max - ((await goodsCollection.findOne({ goodId: good })) || { totalCnt: 0 }).totalCnt),
                    price: metadata.price
                }
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
                return null;
            }
        })
        const items = await Promise.all(goods);
        if (!items) return NextResponse.json({ error: '서버 오류' }, { status: 500, headers: { 'Content-Type': 'application/json; charset=UTF-8' } });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const item = items.find((i: any) => i.id === body.id);
        if (!item) {
            return NextResponse.json({ error: '유효하지 않은 상품' }, { status: 404, headers: { 'Content-Type': 'application/json; charset=UTF-8' } });
        }

        await goodsCollection.updateOne({ stuNum: body.stuNum }, { $inc: { [item.category]: -body.count } });
        await goodsCollection.updateOne({ goodId: DBItem.goodId }, { $inc: { totalCnt: -body.count } });
        await scoresCollection.updateOne({ stuNum: body.stuNum }, { $inc: { score: item.price * Number(body.count) } });
        client.close();
        return NextResponse.json({}, { headers: { 'Content-Type': 'application/json; charset=UTF-8' } });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
        return NextResponse.json({ error: '서버 오류' }, { status: 500, headers: { 'Content-Type': 'application/json; charset=UTF-8' } });
    }
}