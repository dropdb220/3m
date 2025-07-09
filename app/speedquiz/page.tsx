'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { SQSocketEventType } from '@/types';

export default function SpeedQuiz() {
    const [wsConnected, setWsConnected] = useState(false);
    const [code, setCode] = useState('');
    const [connected, setConnected] = useState(false);
    const [ongoing, setOngoing] = useState(false);
    const [problem, setProblem] = useState('');
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [timeTick, setTimeTick] = useState(false);
    const [timer, setTimer] = useState(false);
    const [score, setScore] = useState(-1);

    useEffect(() => {
        const socket = new WebSocket(`ws://${process.env.NEXT_PUBLIC_WS_HOST || 'localhost'}:${process.env.NEXT_PUBLIC_WS_PORT || 3000}/speedquiz`);
        socket.addEventListener('open', () => {
            setWsConnected(true);
        });
        socket.addEventListener('message', ({ data }) => {
            const msg = JSON.parse(data.toString());
            switch (msg.type) {
                case SQSocketEventType.CODE:
                    setCode(msg.data.code);
                    break;
                case SQSocketEventType.ATTACHED:
                    setConnected(true);
                    break;
                case SQSocketEventType.START:
                    setOngoing(true);
                    setTimer(true);
                    setTimeRemaining(msg.data.time);
                    break;
                case SQSocketEventType.END:
                    setOngoing(false);
                    setProblem('');
                    setTimer(false);
                    setTimeRemaining(0);
                    setScore(msg.data.score);
                    break;
                case SQSocketEventType.PROBLEM:
                    setProblem(msg.data.problem);
                    break;
                case SQSocketEventType.TIMER_STOP:
                    setTimer(false);
                    break;
                case SQSocketEventType.TIMER_RESUME:
                    setTimer(true);
                    setTimeRemaining(msg.data.time);
                    break;
                case SQSocketEventType.TIMESYNC:
                    setTimeRemaining(msg.data.remaining - (Date.now() - msg.data.timestamp));
                    setTimeTick(d => !d);
                    break;
                case SQSocketEventType.DETACH:
                    setConnected(false);
                    setOngoing(false);
                    setProblem('');
                    setTimeRemaining(0);
                    setTimer(false);
                    break;
            }
        });
    }, []);

    useEffect(() => {
        if (timer) {
            const intv = setInterval(() => {
                setTimeRemaining(d => d > 100 ? d - 100 : 0);
                if (timeTick) {}
            }, 100);
            return () => clearInterval(intv);
        }
    }, [timer, timeRemaining, timeTick]);

    return (
        <main className="h-dvh w-screen flex flex-col items-center justify-begin text-black dark:text-white">
            <div className="w-full flex flex-row items-center justify-between p-4">
                <h1 className='font-bold text-2xl'>스피드 퀴즈</h1>
                <div className='flex flex-row items-center gap-2'>
                    <div className={`rounded-full ${connected ? 'bg-green-500' : 'bg-orange-400'} w-5 h-5`}></div>
                    <div>{connected ? '연결됨' : (wsConnected ? `관리자 대기 중(${code})` : '연결 중')}</div>
                </div>
            </div>
            <div className="w-full flex flex-row items-center justify-end p-4">
                <Image src="/timer.svg" alt="Clock Icon" className='dark:invert m-4' width={36} height={36} />
                <div className='font-bold text-4xl'>{connected ? `${Math.floor(timeRemaining / 1000)}s` : '--'}</div>
            </div>
            <div className="w-full text-8xl font-bold text-center p-8 mt-32">
                {ongoing ? problem.split('<br>').map((line, idx) => (
                    <p key={idx} className='mb-3'>{line}</p>
                )) : (score >= 0 ? `${score}점` : '대기 중...')}
            </div>
        </main>
    )
}