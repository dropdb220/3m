import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
    const { itemId } = await params;

    if (!/^[a-zA-Z0-9_-]+$/.test(itemId)) {
        return new Response(JSON.stringify({ error: 'Invalid item ID' }), { status: 400, headers: { 'Content-Type': 'application/json; charset=UTF-8' } });
    }

    const filePath = path.join(process.cwd(), 'data', 'goods', itemId, 'image.png');
    if (!fs.existsSync(filePath)) {
        return new Response(JSON.stringify({ error: 'Item not found' }), { status: 404, headers: { 'Content-Type': 'application/json; charset=UTF-8' } });
    }

    const imageBuffer = await fs.promises.readFile(filePath);
    return new Response(imageBuffer, {
        headers: {
            'Content-Type': 'image/png'
        }
    });
}