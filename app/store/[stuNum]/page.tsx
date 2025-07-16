'use client';

import Image from 'next/image';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalStorage } from "usehooks-ts";

function Card(params: { stuNum: string, balance: number, id: string, name: string, remaining: number, price: number, didUpdate: boolean, setDidUpdate: (didUpdate: boolean) => void }) {
    const [count, setCount] = useState(0);
    const [displayThis, setDisplayThis] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [merchantCode, setMerchantCode] = useLocalStorage('merchantCode', '');

    return (
        <>
            <div key={`${params.id}-modal`} className="w-64 aspect-square p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col items-center gap-4" onClick={() => { setDisplayThis(true); setCount(0); }}>
                <Image src={`/api/store/image/${params.id}`} alt={params.name} width={100} height={100} className="rounded" />
                <h2 className="text-xl font-semibold">{params.name}</h2>
                <p>남은 수량: {params.remaining}개</p>
                <p>가격: {params.price}점</p>
                <p>현재 최대 {Math.min(params.remaining, Math.floor(params.balance / params.price))}개 구매 가능</p>
            </div>
            <div className={`bg-black opacity-80 fixed top-0 left-0 w-full h-full z-10 ${!displayThis && 'hidden'}`}></div>
            <div className={`bg-[rgb(239,239,240)] dark:bg-[rgb(32,32,32)] fixed top-1/2 left-1/2 -translate-1/2 rounded-lg min-w-42 z-20 text-center ${!displayThis && 'hidden'}`}>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    if (merchantCode.length < 1) return false;
                    if (count > 0) {
                        fetch(`/api/store/buy`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ stuNum: params.stuNum, id: params.id, count, merchantCode })
                        }).then(r => r.json()).then(d => {
                            if (d.error) {
                                alert(d.error);
                                return false;
                            }
                            setDisplayThis(false);
                            setCount(0);
                            params.setDidUpdate(!params.didUpdate);
                            return false;
                        })
                    } else {
                        setDisplayThis(false);
                        setCount(0);
                        params.setDidUpdate(!params.didUpdate);
                        return false;
                    }
                }}>
                    <div className="p-6">
                        <h1 className="text-black dark:text-white font-bold text-lg mb-2">{params.name}</h1>
                        <p>구매 가능: {Math.min(params.remaining, Math.floor(params.balance / params.price))}개</p>
                        <p>가격: {params.price}점</p>
                        <input type="number" name="qty" className="w-full p-2 mt-4 h-8 rounded-md border border-black dark:border-white bg-[rgb(239,239,240)] dark:bg-[rgb(32,32,32)] text-black dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="구매할 수량" value={count} onChange={(e) => {
                            if (Number(e.currentTarget.value) > Math.min(params.remaining, Math.floor(params.balance / params.price))) setCount(Math.min(params.remaining, Math.floor(params.balance / params.price)));
                            else setCount(Number(e.currentTarget.value));
                        }} />
                    </div>
                    <div className="h-[0.3px] w-full bg-black dark:bg-white"></div>
                    <div className="grid grid-flow-dense">
                        <button type="submit" className="w-full h-10 font-bold text-[rgb(71,127,255)] col-[2]">승인</button>
                        <button type="button" className="w-full h-10 text-[rgb(71,127,255)] border-r-[0.1px] border-black dark:border-white col-[1]" onClick={() => { setDisplayThis(false); }}>취소</button>
                    </div>
                </form>
            </div>
        </>
    )
}

export default function StoreItems({ params }: { params: Promise<{ stuNum: string }> }) {
    const params2 = use(params);
    const [items, setItems] = useState<Array<{ id: string, name: string, max: number, remaining: number, price: number }>>([]);
    const [didUpdate, setDidUpdate] = useState(false);
    const [balance, setBalance] = useState(0);
    const router = useRouter();

    useEffect(() => {
        fetch(`/api/store/items?stuNum=${params2.stuNum}`).then(r => r.json()).then(setItems);
    }, [params2.stuNum, didUpdate]);

    useEffect(() => {
        fetch(`/api/score/${params2.stuNum}`).then(r => r.json()).then(d => {
            if (d.error) {
                router.replace('/store');
            } else {
                setBalance(d.score);
            }
        });
    }, [params2.stuNum, router, didUpdate]);

    return (
        <main className="h-dvh w-screen flex flex-col items-center justify-begin text-black dark:text-white">
            <div className="w-full flex flex-row items-center justify-between p-4">
                <h1 className='font-bold text-2xl'>교환처</h1>
                <div className='flex flex-row items-center gap-2'>
                    <button onClick={(() => {
                        router.replace('/store');
                    })}>로그아웃</button>
                </div>
            </div>
            <div className="w-full text-right p-4">잔액: {balance}점</div>
            <div className="w-full p-8 grid gap-8" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                {items.filter(item => item.remaining > 0).map(item => (
                    <div key={item.id} style={{ marginLeft: 'auto', marginRight: 'auto' }}>
                        <Card stuNum={params2.stuNum} balance={balance} id={item.id} name={item.name} remaining={item.remaining} price={item.price} didUpdate={didUpdate} setDidUpdate={setDidUpdate} />
                    </div>
                ))}
                {items.filter(items => items.remaining > 0).length === 0 && (
                    <>
                        <div />
                        <h1 className="w-full text-3xl text-center font-bold">구매 가능한 상품 없음</h1>
                    </>
                )}
            </div>
        </main>
    )
}
