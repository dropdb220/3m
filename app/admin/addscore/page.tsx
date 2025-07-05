'use client';

import { FormEvent, useEffect, useState } from "react";

export default function AddScore() {
  const [msg, setMsg] = useState('');
  const [errorCnt, setErrorCnt] = useState(0);
  const [input, setInput] = useState('');
  const [displayScore, setDisplayScore] = useState(false);
  const [score, setScore] = useState(0);
  const [addScore, setAddScore] = useState('');
  const [shake, setShake] = useState(false);
  const [PSK, setPSK] = useState('');

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
        setScore(d.score);
        setDisplayScore(true);
      });
    } else {
      setDisplayScore(false);
      window.scrollTo(0, 0);
    }
  }, [input, errorCnt]);
  useEffect(() => {
    if (errorCnt <= 0) setMsg('');
  }, [errorCnt]);
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key) && input.length < 5) {
        setInput(input + e.key);
      } else if (e.key === 'Backspace') {
        if (input.length > 0 && !displayScore) {
          setInput(input.slice(0, -1));
        }
      } else if (e.key === 'Escape') {
        if (displayScore) {
          setInput('');
        }
      }
    }
    window.addEventListener('keydown', listener);
    return () => {
      window.removeEventListener('keydown', listener);
    };
  }, [input, displayScore]);
  useEffect(() => {
    setPSK(prompt("보안코드 입력") || '');
  }, []);

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
        <div className={`bg-black opacity-80 fixed top-0 left-0 w-full h-full z-10 ${!displayScore && 'hidden'}`}></div>
        <form onSubmit={(e: FormEvent) => {
          e.preventDefault();
          fetch(`/api/score/${input}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': PSK
            },
            body: JSON.stringify({ score: Number(addScore) })
          }).then(r => r.json()).then(d => {
            setInput('');
            if (d.error) {
              setAddScore('');
              setDisplayScore(false);
              setErrorCnt(d => d + 1);
              setMsg(d.error);
              setShake(true);
              setTimeout(() => {
                setShake(false);
              }, 1000);
              setTimeout(() => {
                setErrorCnt(d => d - 1);
              }, 3000);
            } else {
              setDisplayScore(false);
              setAddScore('');
            }
            return false;
          });
        }}>
          <div className={`bg-[rgb(239,239,240)] dark:bg-[rgb(32,32,32)] fixed top-1/2 left-1/2 -translate-1/2 rounded-lg min-w-42 z-20 text-center ${!displayScore && 'hidden'}`}>
            <div className="p-6">
              <h1 className="text-black dark:text-white font-bold text-lg mb-2">점수 추가</h1>
              <p>현재 점수: {score}</p>
              <input type="number" name="addscore" className="w-full p-2 mt-4 h-8 rounded-md border border-black dark:border-white bg-[rgb(239,239,240)] dark:bg-[rgb(32,32,32)] text-black dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="추가할 점수" value={addScore} onChange={(e) => setAddScore(e.currentTarget.value)} />
            </div>
            <div className="h-[0.3px] w-full bg-black dark:bg-white"></div>
            <div className="grid grid-flow-dense">
              <button type="submit" className="w-full h-10 font-bold text-[rgb(71,127,255)] col-[2]">승인</button>
              <button type="button" className="w-full h-10 text-[rgb(71,127,255)] border-r-[0.1px] border-black dark:border-white col-[1]" onClick={() => { setInput(''); setAddScore(''); }}>취소</button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
