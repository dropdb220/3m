import WebSocket, { WebSocketServer } from 'ws';
import { SQSocketEventType, SMSocketEventType, SQState } from '../types.js';
import dotenv from "dotenv";
import fs from 'node:fs/promises';

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

const wss = new WebSocketServer({ port: Number(process.env.NEXT_PUBLIC_WS_PORT) || 4000 });
wss.on('connection', (ws, req) => {
    let identified = false;
    let code = '';
    let state = SQState.PENDING;
    let score = 0;
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
                        ws.send(JSON.stringify({ type: SMSocketEventType.START, data: { time: 40000 } }));
                        clients.get(code)?.send(JSON.stringify({ type: SQSocketEventType.START, data: { time: 40000 } }));
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
                    ws.send(JSON.stringify({ type: SMSocketEventType.TIMER_STOP }));
                    clients.get(code)?.send(JSON.stringify({ type: SQSocketEventType.TIMER_STOP }));
                    break;
                case SMSocketEventType.TIMER_RESUME:
                    ws.send(JSON.stringify({ type: SMSocketEventType.TIMER_RESUME, data: { time: msg.data.time } }));
                    clients.get(code)?.send(JSON.stringify({ type: SQSocketEventType.TIMER_RESUME, data: { time: msg.data.time } }));
                    break;
            }
        })
    }
});