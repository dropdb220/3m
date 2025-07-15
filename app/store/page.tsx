'use client';

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { useLocalStorage } from "usehooks-ts";

export default function StoreEntry() {
    const [msg, setMsg] = useState('');
    const [errorCnt, setErrorCnt] = useState(0);
    const [input, setInput] = useState('');
    const [shake, setShake] = useState(false);
    const [merchantCode, setMerchantCode] = useLocalStorage('merchantCode', '');
    const router = useRouter();

    useEffect(() => {
        if (input.length === 5) {
            fetch(`/api/score/${input}`).then(r => r.json()).then(d => {
                if (d.error) {
                    setErrorCnt(d => d + 1);
                    setShake(true);
                    setTimeout(() => {
                        setShake(false);
                    }, 1000);
                    setMsg(d.error);
                    setTimeout(() => {
                        setErrorCnt(d => d - 1);
                    }, 3000);
                    setInput('');
                    return;
                }
                router.push(`/store/${input}`);
            });
        } else {
            window.scrollTo(0, 0);
        }
    }, [input, errorCnt, router]);
    useEffect(() => {
        if (errorCnt <= 0) setMsg('');
    }, [errorCnt]);
    useEffect(() => {
        const listener = (e: KeyboardEvent) => {
            if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key) && input.length < 5) {
                setInput(input + e.key);
            } else if (e.key === 'Backspace') {
                if (input.length > 0) {
                    setInput(input.slice(0, -1));
                }
            }
        }
        window.addEventListener('keydown', listener);
        return () => {
            window.removeEventListener('keydown', listener);
        };
    }, [input]);
    useEffect(() => {
        if (merchantCode.length < 1) {
            setMerchantCode(prompt('계산대 번호(숫자) 입력') || '');
        }
    }, [merchantCode, setMerchantCode]);

    return (
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center h-dvh p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <main className="flex flex-col gap-[32px] row-start-2 items-center">
                <h1 className="text-xl">{msg === '' ? '학번 입력' : msg}</h1>
                <div className="flex flex-row gap-[16px] w-full sm:w-[400px] justify-center">
                    {
                        new Array(5).fill(0).map((_, idx) => (
                            <div key={idx} className={`border border-black dark:border-white rounded-full p-1 transition-[background-color] ${input.length > idx && 'bg-black dark:bg-white'} ${shake && 'animate-[shake_.5s_linear_1]'}`}></div>
                        ))
                    }
                </div>
                <br /><br />
                <div className="flex flex-row gap-[32px] w-full sm:w-[400px] justify-center">
                    {
                        new Array(3).fill(0).map((_, idx) => (
                            <div key={idx} tabIndex={0} onClick={() => { if (input.length < 5) setInput(input + (idx + 1)) }} className="border border-black dark:border-white rounded-full p-6 max-w-14 max-h-14 flex flex-col items-center justify-center text-3xl transition-[background-color] duration-200 hover:bg-gray-600">{idx + 1}</div>
                        ))
                    }
                </div>
                <div className="flex flex-row gap-[32px] w-full sm:w-[400px] justify-center">
                    {
                        new Array(3).fill(0).map((_, idx) => (
                            <div key={idx} tabIndex={0} onClick={() => { if (input.length < 5) setInput(input + (idx + 4)) }} className="border border-black dark:border-white rounded-full p-6 max-w-14 max-h-14 flex flex-col items-center justify-center text-3xl transition-[background-color] duration-200 hover:bg-gray-600">{idx + 4}</div>
                        ))
                    }
                </div>
                <div className="flex flex-row gap-[32px] w-full sm:w-[400px] justify-center">
                    {
                        new Array(3).fill(0).map((_, idx) => (
                            <div key={idx} tabIndex={0} onClick={() => { if (input.length < 5) setInput(input + (idx + 7)) }} className="border border-black dark:border-white rounded-full p-6 max-w-14 max-h-14 flex flex-col items-center justify-center text-3xl transition-[background-color] duration-200 hover:bg-gray-600">{idx + 7}</div>
                        ))
                    }
                </div>
                <div className="flex flex-row gap-[32px] w-full sm:w-[400px] justify-center">
                    <div className="border border-black dark:border-white rounded-full p-6 max-w-14 max-h-14 flex flex-col items-center justify-center text-3xl opacity-0">0</div>
                    <div onClick={() => { setInput(input + '0'); }} className="border border-black dark:border-white rounded-full p-6 max-w-14 max-h-14 flex flex-col items-center justify-center text-3xl transition-[background-color] duration-200 hover:bg-gray-600">0</div>
                    <div className="w-14 h-14 text-center text-sm grid grid-rows-3">
                        <div></div>
                        <div className={`${input === '' ? 'hidden' : ''}`} onClick={() => {
                            if (input.length > 0) setInput(input.slice(0, -1));
                        }}>지우기</div>
                        <div></div>
                    </div>
                </div>
            </main>
        </div>
    );
}
