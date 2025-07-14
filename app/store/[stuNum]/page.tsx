'use client';

import Image from 'next/image';
import { useState, useEffect, use } from 'react';

function Card(item: { id: string, name: string, max: number, remaining: number, price: number }) {
    const [count, setCount] = useState(0);
    const [displayThis, setDisplayThis] = useState(false);

    return (
        <>
            <div key={item.id} className="w-64 aspect-square p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col items-center gap-4">
                <Image src={`/api/store/image/${item.id}`} alt={item.name} width={100} height={100} className="rounded" />
                <h2 className="text-xl font-semibold">{item.name}</h2>
                <p>남은 수량: {item.remaining}/{item.max}</p>
                <p>가격: {item.price}점</p>
            </div>
            <div className={`bg-black opacity-80 fixed top-0 left-0 w-full h-full z-10 ${!displayThis && 'hidden'}`}></div>
            <div className={`bg-[rgb(239,239,240)] dark:bg-[rgb(32,32,32)] fixed top-1/2 left-1/2 -translate-1/2 rounded-lg min-w-42 z-20 text-center ${!displayThis && 'hidden'}`}>
                <div className="p-6">
                    <h1 className="text-black dark:text-white font-bold text-lg mb-2">현재 점수</h1>
                    <p>{score}</p>
                </div>
                <div className="h-[0.3px] w-full bg-black dark:bg-white"></div>
                <button className="w-full h-10 font-bold text-[rgb(71,127,255)]" onClick={() => { setInput(''); }}>승인</button>
            </div>
        </>
    )
}

export default function StoreItems({ params }: { params: Promise<{ stuNum: string }> }) {
    const params2 = use(params);
    const [items, setItems] = useState<Array<{ id: string, name: string, max: number, remaining: number, price: number }>>([]);

    useEffect(() => {
        fetch(`/api/store/items?stuNum=${params2.stuNum}`).then(r => r.json()).then(setItems);
    }, [params2.stuNum]);

    return (
        <main className="h-dvh w-screen flex flex-col items-center justify-begin text-black dark:text-white">
            <div className="w-full flex flex-row items-center justify-between p-4">
                <h1 className='font-bold text-2xl'>교환처</h1>
            </div>
            <div className="w-full p-8 flex flex-row items-center justify-center gap-8">
                {items.map(item => (
                    <>

                    </>
                ))}
            </div>
        </main>
    )
}
