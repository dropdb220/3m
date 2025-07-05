'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { SMSocketEventType } from '@/types';

export default function SpeedQuiz() {
    const [PSK, setPSK] = useState('');
    const [wsConnected, setWsConnected] = useState(false);
    const [connected, setConnected] = useState(false);
    const [ongoing, setOngoing] = useState(false);
    const [problem, setProblem] = useState('');
    const [answer, setAnswer] = useState('');
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [timer, setTimer] = useState(false);
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [score, setScore] = useState(-1);
    const router = useRouter();

    useEffect(() => {
        const socket = new WebSocket(`ws://${process.env.NEXT_PUBLIC_WS_HOST || 'localhost'}:${process.env.NEXT_PUBLIC_WS_PORT || 3000}/speedquiz/manager`);
        socket.addEventListener('open', () => {
            setWsConnected(true);
            setSocket(socket);
            const psk = prompt('보안코드 입력') || '';
            setPSK(psk);
            socket.send(JSON.stringify({ type: SMSocketEventType.IDENTIFY, data: { PSK: psk, code: prompt('iPad 화면에 보이는 코드 입력') } }));
        });
        socket.addEventListener('message', ({ data }) => {
            const msg = JSON.parse(data.toString());
            switch (msg.type) {
                case SMSocketEventType.UNAUTHORIZED:
                    if (msg.data.PSKError) {
                        alert('보안코드 오류');
                        router.refresh();
                    }
                    break;
                case SMSocketEventType.INVALID_CODE:
                    socket.send(JSON.stringify({ type: SMSocketEventType.IDENTIFY, data: { PSK, code: prompt('iPad 화면에 보이는 코드 입력') } }));
                    break;
                case SMSocketEventType.IDENTIFIED:
                    setConnected(true);
                    break;
                case SMSocketEventType.START:
                    setOngoing(true);
                    setTimer(true);
                    setTimeRemaining(msg.data.time);
                    break;
                case SMSocketEventType.END:
                    setOngoing(false);
                    setProblem('');
                    setTimer(false);
                    setTimeRemaining(0);
                    break;
                case SMSocketEventType.PROBLEM:
                    setProblem(msg.data.problem);
                    setAnswer(msg.data.answer);
                    break;
                case SMSocketEventType.TIMER_STOP:
                    setTimer(false);
                    break;
                case SMSocketEventType.TIMER_RESUME:
                    setTimer(true);
                    setTimeRemaining(msg.data.time);
                    break;
                case SMSocketEventType.FINISH:
                    setTimer(false);
                    setTimeRemaining(0);
                    setOngoing(false);
                    setScore(msg.data.score);
                    break;
                case SMSocketEventType.DETACH:
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
            }, 100);
            return () => clearInterval(intv);
        }
    }, [timer, timeRemaining]);

    return (
        <main className="h-dvh w-screen flex flex-col items-center justify-begin text-black dark:text-white">
            <div className="w-full flex flex-row items-center justify-between p-4">
                <h1 className='font-bold text-2xl'>스피드 퀴즈 진행</h1>
                <div className='flex flex-row items-center gap-2'>
                    <div className={`rounded-full ${connected ? 'bg-green-500' : 'bg-orange-400'} w-5 h-5`}></div>
                    <div>{connected ? '연결됨' : (wsConnected ? `페어링 대기 중` : '연결 중')}</div>
                </div>
            </div>
            <div className="w-full flex flex-row items-center justify-end p-4">
                <Image src="/timer.svg" alt="Clock Icon" className='dark:invert m-4' width={36} height={36} />
                <div className='font-bold text-4xl'>{connected ? `${Math.floor(timeRemaining / 1000)}s` : '--'}</div>
            </div>
            <div className="w-full text-4xl font-bold text-center p-8 mt-32">
                {ongoing ? problem.split('<br>').map((line, idx) => (
                    <p key={idx} className='mb-3'>{line}</p>
                )) : (score >= 0 ? `${score}점` : '대기 중...')}
            </div>
            {
                ongoing && (
                    <div className="w-full text-md text-center p-8">정답: {answer}</div>
                )
            }
            <div className="flex flex-row items-center justify-center gap-4">
                {connected && ongoing && (
                    <button onClick={() => {
                        if (!connected || !ongoing) return;
                        if (timer) {
                            socket?.send(JSON.stringify({ type: SMSocketEventType.TIMER_STOP }));
                        } else {
                            socket?.send(JSON.stringify({ type: SMSocketEventType.TIMER_RESUME, data: { time: timeRemaining } }));
                        }
                    }}>
                        {timer
                            ? <Image src="/pause.svg" alt="Pause Icon" className='dark:invert' width={36} height={36} />
                            : <Image src="/play.svg" alt="Play Icon" className='dark:invert' width={36} height={36} />
                        }
                    </button>
                )}
                {connected && ongoing && (
                    <button onClick={() => {
                        if (!connected || !ongoing) return;
                        socket?.send(JSON.stringify({ type: SMSocketEventType.PROBLEM, data: { correct: false } }))
                    }}>
                        <Image src="/next.svg" alt="Next Problem Icon" className='dark:invert' width={36} height={36} />
                    </button>
                )}
                {connected && ongoing && (
                    <button onClick={() => {
                        if (!connected || !ongoing) return;
                        socket?.send(JSON.stringify({ type: SMSocketEventType.PROBLEM, data: { correct: true } }));
                    }}>
                        <Image src="/correct.svg" alt="Correct Icon" className='dark:invert' width={36} height={36} />
                    </button>
                )}
                {connected && !ongoing && (
                    <button onClick={() => {
                        if (!connected || ongoing) return;
                        socket?.send(JSON.stringify({ type: SMSocketEventType.START }))
                    }}>
                        <Image src="/start.svg" alt="Start Icon" className='dark:invert' width={36} height={36} />
                    </button>
                )}
            </div>
        </main>
    )
}