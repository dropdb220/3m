'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { MCSocketEventType } from '@/types';

export default function SpeedQuiz() {
    const [PSK, setPSK] = useState('');
    const [wsConnected, setWsConnected] = useState(false);
    const [connected, setConnected] = useState(false);
    const [transactions, setTransactions] = useState<Array<{ ts: number, stuNum: string, id: string, name: string, count: number }>>([]);
    const router = useRouter();

    useEffect(() => {
        const socket = new WebSocket(`ws://${process.env.NEXT_PUBLIC_WS_HOST || 'localhost'}:${process.env.NEXT_PUBLIC_WS_PORT || 4000}/merchant`);
        socket.addEventListener('open', () => {
            setWsConnected(true);
            const psk = prompt('보안코드 입력') || '';
            setPSK(psk);
            socket.send(JSON.stringify({ type: MCSocketEventType.IDENTIFY, data: { PSK: psk, code: prompt('계산대 번호(숫자) 입력') } }));
        });
        socket.addEventListener('message', ({ data }) => {
            const msg = JSON.parse(data.toString());
            switch (msg.type) {
                case MCSocketEventType.UNAUTHORIZED:
                    if (msg.data.PSKError) {
                        alert('보안코드 오류');
                        router.refresh();
                    }
                    break;
                case MCSocketEventType.INVALID_CODE:
                    alert('계산대 번호 오류');
                    router.refresh();
                    break;
                case MCSocketEventType.IDENTIFIED:
                    setConnected(true);
                    break;
                case MCSocketEventType.PURCHASE:
                    setTransactions(prev => [...prev, { ts: Date.now(), stuNum: msg.data.stuNum, id: msg.data.id, name: msg.data.name, count: msg.data.count }]);
                    break;
            }
        });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <main className="h-dvh w-screen flex flex-col items-center justify-begin text-black dark:text-white">
            <div className="w-full flex flex-row items-center justify-between p-4">
                <h1 className='font-bold text-2xl'>교환처</h1>
                <div className='flex flex-row items-center gap-2'>
                    <div className={`rounded-full ${connected ? 'bg-green-500' : 'bg-orange-400'} w-5 h-5`}></div>
                    <div>{connected ? '연결됨' : (wsConnected ? `페어링 대기 중` : '연결 중')}</div>
                </div>
            </div>
            <div className="fle flex-col items-center justify-center gap-4 w-full h-full p-8">
                {transactions.slice(0).reverse().slice(0, 10).map((t, idx) => (
                    <div className="flex flex-row items-center justify-between w-full p-4 m-2 bg-gray-100 dark:bg-gray-800 rounded-md" key={idx}>
                        <div className="w-full grid grid-cols-[1fr_auto]">
                            <div className="flex flex-col">
                                <div className="font-bold">{t.stuNum} 학생</div>
                                <span>{t.name} {t.count}개</span>
                                <span>{new Date(t.ts).toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul' })}</span>
                            </div>
                            <button onClick={() => {
                                if (!confirm('정말로 취소하시겠습니까?')) return;
                                fetch('/api/store/buy', {
                                    method: 'DELETE',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': PSK
                                    },
                                    body: JSON.stringify({ stuNum: t.stuNum, id: t.id, count: t.count })
                                }).then(r => r.json()).then(d => {
                                    if (d.error) {
                                        alert(d.error);
                                    } else {
                                        setTransactions(prev => prev.filter(x => x.ts !== t.ts));
                                    }
                                });
                            }}>취소하기</button>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    )
}
