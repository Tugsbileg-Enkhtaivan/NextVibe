"use client";

import { useState, useEffect } from 'react';

export default function JackpotPage() {
    const [numbers, setNumbers] = useState([0, 0, 0]);
    const [spinning, setSpinning] = useState(false);
    const [winner, setWinner] = useState(false);
    const [jackpot, setJackpot] = useState(1000000);
    const [lastWin, setLastWin] = useState(0);

    const spinReels = () => {
        if (spinning) return;

        setWinner(false);
        setSpinning(true);

        // Increase jackpot slightly each time
        setJackpot(prev => Math.floor(prev * 1.05));

        // Generate random timing for each digit to create staggered effect
        const timings = [
            800 + Math.random() * 500,
            1200 + Math.random() * 500,
            1600 + Math.random() * 500,
            2000 + Math.random() * 500,
            2400 + Math.random() * 500,
        ];

        // Start spinning animation
        const intervals: (string | number | NodeJS.Timeout | undefined)[] = [];

        for (let i = 0; i < numbers.length; i++) {
            intervals.push(
                setInterval(() => {
                    setNumbers(prev => {
                        const newNumbers = [...prev];
                        newNumbers[i] = Math.floor(Math.random() * 10);
                        return newNumbers;
                    });
                }, 50)
            );
        }

        // Stop each reel after its timing
        for (let i = 0; i < numbers.length; i++) {
            setTimeout(() => {
                clearInterval(intervals[i]);

                // If this is the last reel, check for win and stop spinning
                if (i === numbers.length - 1) {
                    setTimeout(() => {
                        setSpinning(false);
                        const allSame = numbers.every(n => n === numbers[0]);
                        if (allSame) {
                            setWinner(true);
                            setLastWin(jackpot);
                            setJackpot(1000000); // Reset jackpot after win
                        }
                    }, 300);
                }
            }, timings[i]);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 flex flex-col items-center justify-center p-4">
            <div className="text-center mb-8">
                <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 mb-4">
                    MEGA JACKPOT
                </h1>
                <div className="text-2xl font-bold text-yellow-200 animate-pulse">
                    Current Prize: ${jackpot.toLocaleString()}
                </div>
            </div>

            <div className="bg-black bg-opacity-70 p-8 rounded-xl shadow-2xl border-4 border-yellow-500 mb-8">
                <div className="flex gap-2 mb-6">
                    {numbers.map((number, index) => (
                        <div
                            key={index}
                            className={`w-16 h-24 md:w-20 md:h-28 flex items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg border-2 ${spinning ? 'border-red-500' : 'border-gray-600'} text-6xl font-bold ${spinning ? 'text-white' : 'text-yellow-400'} shadow-inner`}
                            style={{
                                transition: 'all 0.2s ease',
                                transform: spinning ? 'translateY(2px)' : 'translateY(0)'
                            }}
                        >
                            {number}
                        </div>
                    ))}
                </div>

                <button
                    onClick={spinReels}
                    disabled={spinning}
                    className={`w-full py-4 rounded-full text-xl font-bold uppercase tracking-wider transition-all ${spinning
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg hover:shadow-xl'
                        }`}
                >
                    {spinning ? 'Spinning...' : 'Spin Now!'}
                </button>
            </div>

            {winner && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
                    <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 p-8 rounded-xl shadow-2xl animate-bounce text-center max-w-md">
                        <h2 className="text-4xl font-extrabold text-black mb-4">JACKPOT!</h2>
                        <p className="text-2xl font-bold text-black mb-6">
                            You won ${lastWin.toLocaleString()}!
                        </p>
                        <button
                            onClick={() => setWinner(false)}
                            className="bg-black text-yellow-400 px-6 py-3 rounded-full font-bold hover:bg-gray-800"
                        >
                            Collect Prize
                        </button>
                    </div>
                </div>
            )}

            <div className="mt-6 text-center">
                <p className="text-yellow-200 text-sm mb-1">Last big winner: ${lastWin.toLocaleString()}</p>
                <p className="text-gray-400 text-xs">Match all 5 numbers to win the jackpot!</p>
            </div>
        </div>
    );
}