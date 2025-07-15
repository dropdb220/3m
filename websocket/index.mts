import WebSocket, { WebSocketServer } from 'ws';
import { SQSocketEventType, SMSocketEventType, SQState, MCSocketEventType } from '../types.js';
import dotenv from "dotenv";
import fs from 'node:fs/promises';
import http from 'node:http';

const allProblems: Array<{ points: number, question: string, answer: string }> = (await fs.readFile(new URL('../../data/problems.csv', import.meta.url), 'utf8')).split('\n').map(p => {
    return {
        points: Number(p.split(',')[0]),
        question: p.split(',')[1],
        answer: p.split(',')[2]
    }
});

const NODE_ENV = process.env.NODE_ENV || "development";

dotenv.config({ path: [`.env.${NODE_ENV}.local`, `.env.${NODE_ENV}`, '.env'] });

const clients = new Map<string, WebSocket>();
const merchants: Array<{ code: string, socket: WebSocket }> = [];

const wss = new WebSocketServer({ port: Number(process.env.NEXT_PUBLIC_WS_PORT) || 4000 });
wss.on('connection', (ws, req) => {
    let identified = false;
    let code = '';
    let state = SQState.PENDING;
    let score = 0;
    let scores = [0, 0, 0];
    let problems = allProblems.slice(0);
    let currentProblem = { points: 0, question: '', answer: '' };
    if (req.url === '/speedquiz') {
        let code = '';
        do {
            code = new Array(6).fill(0).map(() => Math.floor(Math.random() * 26) + 65).map(x => String.fromCharCode(x)).join('');
        } while (clients.has(code));
        clients.set(code, ws);
        ws.send(JSON.stringify({ type: SQSocketEventType.CODE, data: { code } }));
    } else if (req.url === '/speedquiz/manager') {
        ws.on('message', data => {
            const msg = JSON.parse(data.toString());
            switch (msg.type) {
                case SMSocketEventType.IDENTIFY:
                    if (msg.data.PSK !== process.env.PSK) {
                        ws.send(JSON.stringify({ type: SMSocketEventType.UNAUTHORIZED, data: { PSKError: true } }));
                        ws.close();
                    } else {
                        if (clients.has(msg.data.code)) {
                            code = msg.data.code;
                            ws.send(JSON.stringify({ type: SMSocketEventType.IDENTIFIED }));
                            clients.get(code)?.send(JSON.stringify({ type: SQSocketEventType.ATTACHED }));
                            identified = true;
                        } else {
                            ws.send(JSON.stringify({ type: SMSocketEventType.INVALID_CODE }));
                        }
                    }
                    break;
                case SMSocketEventType.START:
                    if (!identified) ws.send(JSON.stringify({ type: SMSocketEventType.UNAUTHORIZED }));
                    else if (state === SQState.PENDING) {
                        state = SQState.ONGOING;
                        score = 0;
                        problems = allProblems.slice(0);
                        ws.send(JSON.stringify({ type: SMSocketEventType.START, data: { time: 39999 } }));
                        clients.get(code)?.send(JSON.stringify({ type: SQSocketEventType.START, data: { time: 39999 } }));
                        currentProblem = problems[Math.floor(Math.random() * problems.length)];
                        problems.splice(problems.indexOf(currentProblem), 1);
                        ws.send(JSON.stringify({ type: SMSocketEventType.PROBLEM, data: { problem: currentProblem.question, answer: currentProblem.answer } }));
                        clients.get(code)?.send(JSON.stringify({ type: SQSocketEventType.PROBLEM, data: { problem: currentProblem.question } }));
                    }
                    break;
                case SMSocketEventType.PROBLEM:
                    if (msg.data.correct) score += currentProblem.points;
                    currentProblem = problems[Math.floor(Math.random() * problems.length)];
                    problems.splice(problems.indexOf(currentProblem), 1);
                    ws.send(JSON.stringify({ type: SMSocketEventType.PROBLEM, data: { problem: currentProblem.question, answer: currentProblem.answer } }));
                    clients.get(code)?.send(JSON.stringify({ type: SQSocketEventType.PROBLEM, data: { problem: currentProblem.question } }));
                    break;
                case SMSocketEventType.TIMER_STOP:
                    if (state === SQState.ONGOING) {
                        state = SQState.TIMER_STOPPED;
                        ws.send(JSON.stringify({ type: SMSocketEventType.TIMER_STOP }));
                        clients.get(code)?.send(JSON.stringify({ type: SQSocketEventType.TIMER_STOP }));
                    }
                    break;
                case SMSocketEventType.TIMER_RESUME:
                    if (state === SQState.TIMER_STOPPED) {
                        state = SQState.ONGOING;
                        ws.send(JSON.stringify({ type: SMSocketEventType.TIMER_RESUME, data: { time: msg.data.time } }));
                        clients.get(code)?.send(JSON.stringify({ type: SQSocketEventType.TIMER_RESUME, data: { time: msg.data.time } }));
                    }
                    break;
                case SMSocketEventType.TIMESYNC:
                    (async () => {
                        ws.send(JSON.stringify({ type: SMSocketEventType.TIMESYNC, data: { remaining: msg.data.remaining, timestamp: msg.data.timestamp } }));
                    })();
                    clients.get(code)?.send(JSON.stringify({ type: SQSocketEventType.TIMESYNC, data: { remaining: msg.data.remaining, timestamp: msg.data.timestamp } }));
                    break;
                case SMSocketEventType.END:
                    if (state === SQState.ONGOING) {
                        state = SQState.PENDING;
                        ws.send(JSON.stringify({ type: SMSocketEventType.END, data: { score } }));
                        clients.get(code)?.send(JSON.stringify({ type: SQSocketEventType.END, data: { score } }));
                    }
            }
        })
    } else if (req.url === '/speedquiz3/manager') {
        ws.on('message', data => {
            const msg = JSON.parse(data.toString());
            switch (msg.type) {
                case SMSocketEventType.IDENTIFY:
                    if (msg.data.PSK !== process.env.PSK) {
                        ws.send(JSON.stringify({ type: SMSocketEventType.UNAUTHORIZED, data: { PSKError: true } }));
                        ws.close();
                    } else {
                        if (clients.has(msg.data.code1) && clients.has(msg.data.code2) && clients.has(msg.data.code3)) {
                            code = `${msg.data.code1}-${msg.data.code2}-${msg.data.code3}`;
                            ws.send(JSON.stringify({ type: SMSocketEventType.IDENTIFIED }));
                            code.split('-').forEach(c => { clients.get(c)?.send(JSON.stringify({ type: SQSocketEventType.ATTACHED })); });
                            identified = true;
                        } else {
                            ws.send(JSON.stringify({ type: SMSocketEventType.INVALID_CODE }));
                        }
                    }
                    break;
                case SMSocketEventType.START:
                    if (!identified) ws.send(JSON.stringify({ type: SMSocketEventType.UNAUTHORIZED }));
                    else if (state === SQState.PENDING) {
                        state = SQState.ONGOING;
                        scores = [0, 0, 0];
                        problems = allProblems.slice(0);
                        ws.send(JSON.stringify({ type: SMSocketEventType.START, data: { time: 39999 } }));
                        code.split('-').forEach(c => { clients.get(c)?.send(JSON.stringify({ type: SQSocketEventType.START, data: { time: 39999 } })); });
                        currentProblem = problems[Math.floor(Math.random() * problems.length)];
                        problems.splice(problems.indexOf(currentProblem), 1);
                        ws.send(JSON.stringify({ type: SMSocketEventType.PROBLEM, data: { problem: currentProblem.question, answer: currentProblem.answer } }));
                        code.split('-').forEach(c => { clients.get(c)?.send(JSON.stringify({ type: SQSocketEventType.PROBLEM, data: { problem: currentProblem.question } })); });
                    }
                    break;
                case SMSocketEventType.PROBLEM:
                    if (msg.data.correct) scores[msg.data.player - 1] += currentProblem.points;
                    currentProblem = problems[Math.floor(Math.random() * problems.length)];
                    problems.splice(problems.indexOf(currentProblem), 1);
                    ws.send(JSON.stringify({ type: SMSocketEventType.PROBLEM, data: { problem: currentProblem.question, answer: currentProblem.answer } }));
                    code.split('-').forEach(c => { clients.get(c)?.send(JSON.stringify({ type: SQSocketEventType.PROBLEM, data: { problem: currentProblem.question } })); });
                    break;
                case SMSocketEventType.TIMER_STOP:
                    if (state === SQState.ONGOING) {
                        state = SQState.TIMER_STOPPED;
                        ws.send(JSON.stringify({ type: SMSocketEventType.TIMER_STOP }));
                        code.split('-').forEach(c => { clients.get(c)?.send(JSON.stringify({ type: SQSocketEventType.TIMER_STOP })); });
                    }
                    break;
                case SMSocketEventType.TIMER_RESUME:
                    if (state === SQState.TIMER_STOPPED) {
                        state = SQState.ONGOING;
                        ws.send(JSON.stringify({ type: SMSocketEventType.TIMER_RESUME, data: { time: msg.data.time } }));
                        code.split('-').forEach(c => { clients.get(c)?.send(JSON.stringify({ type: SQSocketEventType.TIMER_RESUME, data: { time: msg.data.time } })); });
                    }
                    break;
                case SMSocketEventType.TIMESYNC:
                    (async () => {
                        ws.send(JSON.stringify({ type: SMSocketEventType.TIMESYNC, data: { remaining: msg.data.remaining, timestamp: msg.data.timestamp } }));
                    })();
                    code.split('-').forEach(c => { clients.get(c)?.send(JSON.stringify({ type: SQSocketEventType.TIMESYNC, data: { remaining: msg.data.remaining, timestamp: msg.data.timestamp } })); });
                    break;
                case SMSocketEventType.END:
                    if (state === SQState.ONGOING) {
                        state = SQState.PENDING;
                        ws.send(JSON.stringify({ type: SMSocketEventType.END, data: { scores } }));
                        code.split('-').forEach((c, idx) => { clients.get(c)?.send(JSON.stringify({ type: SQSocketEventType.END, data: { score: scores[idx] } })); });
                    }
            }
        })
    } else if (req.url === '/merchant') {
        ws.on('message', data => {
            const msg = JSON.parse(data.toString());
            switch (msg.type) {
                case MCSocketEventType.IDENTIFY:
                    if (msg.data.PSK !== process.env.PSK) {
                        ws.send(JSON.stringify({ type: MCSocketEventType.UNAUTHORIZED, data: { PSKError: true } }));
                        ws.close();
                    } else if (!msg.data.code || msg.data.code.length < 1) {
                        ws.send(JSON.stringify({ type: MCSocketEventType.INVALID_CODE }));
                        ws.close();
                    } else {
                        merchants.push({ code: msg.data.code, socket: ws });
                        ws.send(JSON.stringify({ type: MCSocketEventType.IDENTIFIED }));
                    }
                    break;
            }
        })
    }
});

const server = http.createServer((req, res) => {
    const psk = req.headers['authorization'];
    if (psk !== process.env.PSK) {
        res.writeHead(403, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify({ error: '인증 실패' }));
        return;
    }
    if (req.url!.startsWith('/purchase')) {
        const data = new URLSearchParams(req.url!.split('?')[1]);
        const stuNum = data.get('stuNum');
        const name = data.get('name');
        const count = Number(data.get('count'));
        const merchantCode = data.get('merchant');
        merchants.filter(m => m.code === merchantCode).forEach(m => {
            m.socket.send(JSON.stringify({ type: MCSocketEventType.PURCHASE, data: { stuNum, name, count } }));
        });
        res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify({}));
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify({ error: '잘못된 요청' }));
    }
});
server.listen(Number(process.env.WS_HTTP_PORT) || 4001, () => {
    console.log(`Merchant server is running on port ${process.env.WS_HTTP_PORT || 4001}`);
});