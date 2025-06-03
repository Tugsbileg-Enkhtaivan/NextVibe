// // import JackpotPage from "../components/SlotPage";


// // export default function Home() {
// // return (
// // <div className="min-h-screen flex items-center justify-center bg-gray-100">
// // <div className="p-8 bg-white rounded-lg shadow-lg">
// // <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">🎰 Slot Machine Game</h1>
// // <JackpotPage />
// // </div>
// // </div>
// // );
// // }


// "use client";

// import React, {
// useState,
// useEffect,
// useRef,
// useCallback,
// forwardRef,
// useImperativeHandle,
// } from "react";

// const ICON_HEIGHT = 80;
// const LOSER_MESSAGES = [
// "Not quite",
// "Stop gambling",
// "Hey, you lost!",
// "Ouch! I felt that",
// "Don't beat yourself up",
// "There goes the college fund",
// "I have a cat. You have a loss",
// "You're awesome at losing",
// "Coding is hard",
// "Don't hate the coder",
// ];

// const RepeatButton = ({ onClick }: { onClick: () => void }) => (
// <button
// aria-label="Play again"
// id="repeatButton"
// onClick={onClick}
// className="appearance-none border-none bg-[url('https://github.com/antibland/codes/blob/gh-pages/random-assets/img/slots/repeat.png?raw=true')] bg-transparent bg-cover w-12 h-12 absolute top-10 right-10 cursor-pointer animate-spin-slow"
// />
// );

// const WinningSound = () => (
// <audio autoPlay className="player" preload="none">
// <source src="https://andyhoffman.codes/random-assets/img/slots/winning_slot.wav" />
// </audio>
// );

// type SpinnerProps = {
// onFinish: (position: number) => void;
// timer: number;
// };

// const Spinner = forwardRef(({ onFinish, timer }: SpinnerProps, ref) => {
// const [position, setPosition] = useState(0);
// const [timeRemaining, setTimeRemaining] = useState(timer);
// const timerRef = useRef<NodeJS.Timeout | null>(null);
// const multiplierRef = useRef(Math.floor(Math.random() * (4 - 1) + 1));
// const startPositionRef = useRef(
// Math.floor(Math.random() * 9) * ICON_HEIGHT * -1
// );
// const speedRef = useRef(ICON_HEIGHT * multiplierRef.current);

// const reset = useCallback(() => {
// if (timerRef.current) clearInterval(timerRef.current);

// startPositionRef.current =
// Math.floor(Math.random() * 9) * ICON_HEIGHT * -1;
// multiplierRef.current = Math.floor(Math.random() * (4 - 1) + 1);
// speedRef.current = ICON_HEIGHT * multiplierRef.current;

// setPosition(startPositionRef.current);
// setTimeRemaining(timer);

// timerRef.current = setInterval(() => {
// tick();
// }, 100);
// }, [timer]);

// const getSymbolFromPosition = useCallback(() => {
// const totalSymbols = 9;
// const maxPosition = ICON_HEIGHT * (totalSymbols - 1) * -1;
// const moved = (timer / 100) * multiplierRef.current;
// let currentPosition = startPositionRef.current;

// for (let i = 0; i < moved; i++) {
// currentPosition -= ICON_HEIGHT;
// if (currentPosition < maxPosition) {
// currentPosition = 0;
// }
// }

// onFinish(currentPosition);
// }, [timer, onFinish]);

// const tick = useCallback(() => {
// setTimeRemaining((prev) => {
// if (prev <= 0) {
// if (timerRef.current) clearInterval(timerRef.current);
// getSymbolFromPosition();
// return 0;
// }

// setPosition((prevPosition) => prevPosition - speedRef.current);
// return prev - 100;
// });
// }, [getSymbolFromPosition]);

// useEffect(() => {
// reset();
// return () => {
// if (timerRef.current) clearInterval(timerRef.current);
// };
// }, [reset]);

// useImperativeHandle(ref, () => ({ reset }), [reset]);

// return (
// <div
// style={{
// backgroundImage:
// "url(/assets/mood-slot.webp)",
// backgroundPosition: `0px ${position}px`,
// backgroundRepeat: "repeat-y",
// backgroundColor: "#fff",
// }}
// className="icons w-32 h-[564px] overflow-hidden transition-all ease-in-out duration-300 px-20 translate-z-0"
// />
// );
// });

// Spinner.displayName = "Spinner";

// export default function SlotMachine() {
// const [winner, setWinner] = useState<boolean | null>(null);
// const [matches, setMatches] = useState<number[]>([]);
// const spinnerRefs = useRef<any[]>([]);

// const handleFinish = (value: number) => {
// setMatches((prev) => {
// const newMatches = [...prev, value];
// if (newMatches.length === 3) {
// const first = newMatches[0];
// const results = newMatches.every((match) => match === first);
// setWinner(results);
// }
// return newMatches;
// });
// };

// const handleClick = () => {
// setWinner(null);
// setMatches([]);
// spinnerRefs.current.forEach((spinner) => spinner?.reset());
// };

// const getLoserMessage = () => {
// return LOSER_MESSAGES[Math.floor(Math.random() * LOSER_MESSAGES.length)];
// };

// return (
// <div className="relative h-screen bg-[#292929] font-sans">
// {winner && <WinningSound />}

// <h1 className="text-white text-xl text-center pt-6">
// <span className="inline-block px-4 py-3 border border-white/10">
// {winner === null
// ? "Waiting…"
// : winner
// ? "🤑 Pure skill! 🤑"
// : getLoserMessage()}
// </span>
// </h1>

// <div className="spinner-container absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[.62] flex overflow-hidden h-[632px] p-8">
// <Spinner
// onFinish={handleFinish}
// timer={1000}
// ref={(el) => (spinnerRefs.current[0] = el)}
// />
// <Spinner
// onFinish={handleFinish}
// timer={1400}
// ref={(el) => (spinnerRefs.current[1] = el)}
// />
// <Spinner
// onFinish={handleFinish}
// timer={2200}
// ref={(el) => (spinnerRefs.current[2] = el)}
// />
// <div className="gradient-fade absolute top-8 right-8 bottom-8 left-8 bg-gradient-to-b from-zinc-700 via-transparent to-zinc-700 pointer-events-none" />
// </div>

// {winner !== null && <RepeatButton onClick={handleClick} />}
// </div>
// );
// }

"use client";
import React, {
useState,
useEffect,
useRef,
useCallback,
forwardRef,
useImperativeHandle,
} from "react";

const SPRITE_IMAGES = [
"/assets/activity-slot.webp",
"/assets/genre-slot.webp",
"/assets/mood-slot.webp",
];

const ICON_HEIGHT = 100;
const ICON_COUNTS = [10, 10, 8];

const RESULT_TEXTS = {
hobbies: [
"Reading", "Gaming", "Cooking", "Gardening", "Photography",
"Drawing", "Sports", "Music", "Travel", "Gardening"
],
music: [
"Pop", "Rock", "Jazz", "Classical", "Hip-Hop",
"Electronic", "Country", "R&B", "Folk", "Reggae"
],
emotions: [
"joy", "anger", "envy", "fear", "sadness",
"ennui", "disgust", "shame", "anxiety"
]
};

const RepeatButton = ({ onClick }: { onClick: () => void }) => (
<button
aria-label="Spin again"
onClick={onClick}
className="appearance-none border-none bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full cursor-pointer transition-colors mt-4"
>
🎰 Spin Again
</button>
);

type SpinnerProps = {
onFinish: (iconIndex: number) => void;
timer: number;
spriteIndex: number;
};

const Spinner = forwardRef(({ onFinish, timer, spriteIndex }: SpinnerProps, ref) => {
const [position, setPosition] = useState(0);
const timerRef = useRef<NodeJS.Timeout | null>(null);
const iconCount = ICON_COUNTS[spriteIndex];
const spriteHeight = iconCount * ICON_HEIGHT;
const finalIconRef = useRef(0);

const reset = useCallback(() => {
if (timerRef.current) clearInterval(timerRef.current);
const randomFinalIcon = Math.floor(Math.random() * iconCount);
finalIconRef.current = randomFinalIcon;
const middle = (3 * ICON_HEIGHT) / 2;
const center = (randomFinalIcon * ICON_HEIGHT) + ICON_HEIGHT / 2;
const endPos = middle - center;
const startPos = endPos + spriteHeight * 4;
setPosition(startPos);
let t = timer;
timerRef.current = setInterval(() => {
if (t <= 0) {
clearInterval(timerRef.current!);
setTimeout(() => onFinish(finalIconRef.current), 0);
} else {
setPosition(p => p - ICON_HEIGHT / 2);
t -= 50;
}
}, 50);
}, [timer, iconCount, spriteHeight, onFinish]);

useEffect(() => { reset(); return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, [reset]);
useImperativeHandle(ref, () => ({ reset }), [reset]);

return (
<div className="relative w-[100px] h-[300px] overflow-hidden border-2 border-white/30 rounded-lg mx-1 bg-white/10 backdrop-blur-sm">
<div
style={{
backgroundImage: `url(${SPRITE_IMAGES[spriteIndex]})`,
backgroundPosition: `0px ${position}px`,
backgroundRepeat: "repeat-y",
backgroundSize: `${ICON_HEIGHT}px auto`,
width: `${ICON_HEIGHT}px`,
height: `${spriteHeight}px`,
}}
className="absolute top-0 left-0 transition-none"
/>
<div className="absolute top-24 left-0 right-0 h-24 border-y-2 border-yellow-400/60 pointer-events-none" />
<div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 pointer-events-none" />
</div>
);
});

Spinner.displayName = "Spinner";

export default function SlotMachine() {
const [results, setResults] = useState<number[]>([]);
const [isSpinning, setIsSpinning] = useState(false);
const spinnerRefs = useRef<any[]>([]);

const handleFinish = useCallback((iconIndex: number) => {
setResults(prev => {
const updated = [...prev, iconIndex];
if (updated.length === 3) setIsSpinning(false);
return updated;
});
}, []);

const handleSpin = () => {
setIsSpinning(true);
setResults([]);
spinnerRefs.current.forEach((spinner) => spinner?.reset());
};

const getResultText = (categoryIndex: number, iconIndex: number) => {
const categories = ['hobbies', 'music', 'emotions'] as const;
const category = categories[categoryIndex];
return RESULT_TEXTS[category][iconIndex] || `Icon ${iconIndex}`;
};

const getImage = (category: string, name: string) => {
const fileName = name.toLowerCase().replace(/[^a-z]/g, "-");
return `/generated/${category}-${fileName}.webp`;
};

return (
<div className="relative min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 font-sans flex flex-col items-center justify-center p-4">
<div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20 max-w-2xl w-full transition-all duration-500 ease-out scale-100 hover:scale-105">
<h1 className="text-white text-3xl text-center mb-8 font-bold">🎰 Personal Slot Machine</h1>

<div className="flex justify-center items-center gap-4 mb-8 p-6 bg-white/5 rounded-2xl">
{["🎨 Hobbies", "🎵 Music", "😊 Emotion"].map((label, i) => (
<div key={i} className="text-center">
<div className="text-white text-sm mb-3 font-semibold">{label}</div>
<Spinner onFinish={handleFinish} timer={1000 + i * 400} spriteIndex={i} ref={el => spinnerRefs.current[i] = el} />
</div>
))}
</div>

{results.length === 3 && (
<div className="bg-white/10 rounded-2xl p-6 mb-6 border border-white/20 transition-all duration-700 ease-out transform hover:scale-105">
<h2 className="text-white text-xl font-bold text-center mb-4">Your Results:</h2>
<div className="grid grid-cols-3 gap-4 text-center">
{[0, 1, 2].map((i) => (
<div key={i} className="bg-white/10 rounded-lg p-3">
<div className="text-yellow-300 font-semibold text-sm">
{i === 0 ? "🎨 Hobby" : i === 1 ? "🎵 Music" : "😊 Emotion"}
</div>
<img src={getImage(['hobbies', 'music', 'emotions'][i], getResultText(i, results[i]))} alt="Result image" className="mx-auto mt-2 rounded-md w-16 h-16 object-cover" />
<div className="text-white text-lg font-bold mt-2">
{getResultText(i, results[i])}
</div>
</div>
))}
</div>
<div className="text-center text-white/70 text-sm mt-4">
Try this combination: {getResultText(0, results[0])} while listening to {getResultText(1, results[1])} music when you're feeling {getResultText(2, results[2]).toLowerCase()}!
</div>
</div>
)}

<div className="text-center">
<RepeatButton onClick={handleSpin} />
{isSpinning && <div className="text-white/70 text-sm mt-2">🎲 Spinning...</div>}
</div>

<div className="text-center text-white/60 text-xs mt-6">
<p>Each spin gives you a personalized activity suggestion!</p>
<p className="mt-1">Icons: Hobbies ({ICON_COUNTS[0]}) • Music ({ICON_COUNTS[1]}) • Emotions ({ICON_COUNTS[2]})</p>
</div>
</div>
</div>
);
}

// // import JackpotPage from "../components/SlotPage";


// // export default function Home() {
// // return (
// // <div className="min-h-screen flex items-center justify-center bg-gray-100">
// // <div className="p-8 bg-white rounded-lg shadow-lg">
// // <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">🎰 Slot Machine Game</h1>
// // <JackpotPage />
// // </div>
// // </div>
// // );
// // }


// "use client";

// import React, {
// useState,
// useEffect,
// useRef,
// useCallback,
// forwardRef,
// useImperativeHandle,
// } from "react";

// const ICON_HEIGHT = 80;
// const LOSER_MESSAGES = [
// "Not quite",
// "Stop gambling",
// "Hey, you lost!",
// "Ouch! I felt that",
// "Don't beat yourself up",
// "There goes the college fund",
// "I have a cat. You have a loss",
// "You're awesome at losing",
// "Coding is hard",
// "Don't hate the coder",
// ];

// const RepeatButton = ({ onClick }: { onClick: () => void }) => (
// <button
// aria-label="Play again"
// id="repeatButton"
// onClick={onClick}
// className="appearance-none border-none bg-[url('https://github.com/antibland/codes/blob/gh-pages/random-assets/img/slots/repeat.png?raw=true')] bg-transparent bg-cover w-12 h-12 absolute top-10 right-10 cursor-pointer animate-spin-slow"
// />
// );

// const WinningSound = () => (
// <audio autoPlay className="player" preload="none">
// <source src="https://andyhoffman.codes/random-assets/img/slots/winning_slot.wav" />
// </audio>
// );

// type SpinnerProps = {
// onFinish: (position: number) => void;
// timer: number;
// };

// const Spinner = forwardRef(({ onFinish, timer }: SpinnerProps, ref) => {
// const [position, setPosition] = useState(0);
// const [timeRemaining, setTimeRemaining] = useState(timer);
// const timerRef = useRef<NodeJS.Timeout | null>(null);
// const multiplierRef = useRef(Math.floor(Math.random() * (4 - 1) + 1));
// const startPositionRef = useRef(
// Math.floor(Math.random() * 9) * ICON_HEIGHT * -1
// );
// const speedRef = useRef(ICON_HEIGHT * multiplierRef.current);

// const reset = useCallback(() => {
// if (timerRef.current) clearInterval(timerRef.current);

// startPositionRef.current =
// Math.floor(Math.random() * 9) * ICON_HEIGHT * -1;
// multiplierRef.current = Math.floor(Math.random() * (4 - 1) + 1);
// speedRef.current = ICON_HEIGHT * multiplierRef.current;

// setPosition(startPositionRef.current);
// setTimeRemaining(timer);

// timerRef.current = setInterval(() => {
// tick();
// }, 100);
// }, [timer]);

// const getSymbolFromPosition = useCallback(() => {
// const totalSymbols = 9;
// const maxPosition = ICON_HEIGHT * (totalSymbols - 1) * -1;
// const moved = (timer / 100) * multiplierRef.current;
// let currentPosition = startPositionRef.current;

// for (let i = 0; i < moved; i++) {
// currentPosition -= ICON_HEIGHT;
// if (currentPosition < maxPosition) {
// currentPosition = 0;
// }
// }

// onFinish(currentPosition);
// }, [timer, onFinish]);

// const tick = useCallback(() => {
// setTimeRemaining((prev) => {
// if (prev <= 0) {
// if (timerRef.current) clearInterval(timerRef.current);
// getSymbolFromPosition();
// return 0;
// }

// setPosition((prevPosition) => prevPosition - speedRef.current);
// return prev - 100;
// });
// }, [getSymbolFromPosition]);

// useEffect(() => {
// reset();
// return () => {
// if (timerRef.current) clearInterval(timerRef.current);
// };
// }, [reset]);

// useImperativeHandle(ref, () => ({ reset }), [reset]);

// return (
// <div
// style={{
// backgroundImage:
// "url(/assets/mood-slot.webp)",
// backgroundPosition: `0px ${position}px`,
// backgroundRepeat: "repeat-y",
// backgroundColor: "#fff",
// }}
// className="icons w-32 h-[564px] overflow-hidden transition-all ease-in-out duration-300 px-20 translate-z-0"
// />
// );
// });

// Spinner.displayName = "Spinner";

// export default function SlotMachine() {
// const [winner, setWinner] = useState<boolean | null>(null);
// const [matches, setMatches] = useState<number[]>([]);
// const spinnerRefs = useRef<any[]>([]);

// const handleFinish = (value: number) => {
// setMatches((prev) => {
// const newMatches = [...prev, value];
// if (newMatches.length === 3) {
// const first = newMatches[0];
// const results = newMatches.every((match) => match === first);
// setWinner(results);
// }
// return newMatches;
// });
// };

// const handleClick = () => {
// setWinner(null);
// setMatches([]);
// spinnerRefs.current.forEach((spinner) => spinner?.reset());
// };

// const getLoserMessage = () => {
// return LOSER_MESSAGES[Math.floor(Math.random() * LOSER_MESSAGES.length)];
// };

// return (
// <div className="relative h-screen bg-[#292929] font-sans">
// {winner && <WinningSound />}

// <h1 className="text-white text-xl text-center pt-6">
// <span className="inline-block px-4 py-3 border border-white/10">
// {winner === null
// ? "Waiting…"
// : winner
// ? "🤑 Pure skill! 🤑"
// : getLoserMessage()}
// </span>
// </h1>

// <div className="spinner-container absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[.62] flex overflow-hidden h-[632px] p-8">
// <Spinner
// onFinish={handleFinish}
// timer={1000}
// ref={(el) => (spinnerRefs.current[0] = el)}
// />
// <Spinner
// onFinish={handleFinish}
// timer={1400}
// ref={(el) => (spinnerRefs.current[1] = el)}
// />
// <Spinner
// onFinish={handleFinish}
// timer={2200}
// ref={(el) => (spinnerRefs.current[2] = el)}
// />
// <div className="gradient-fade absolute top-8 right-8 bottom-8 left-8 bg-gradient-to-b from-zinc-700 via-transparent to-zinc-700 pointer-events-none" />
// </div>

// {winner !== null && <RepeatButton onClick={handleClick} />}
// </div>
// );
// }

// "use client";
// import React, {
// useState,
// useEffect,
// useRef,
// useCallback,
// forwardRef,
// useImperativeHandle,
// } from "react";

// const SPRITE_IMAGES = [
// "/assets/activity-slot.webp",
// "/assets/genre-slot.webp",
// "/assets/mood-slot.webp",
// ];

// const ICON_HEIGHT = 100;
// const ICON_COUNTS = [10, 10, 8];

// const RESULT_TEXTS = {
// hobbies: [
// "Reading", "Gaming", "Cooking", "Gardening", "Photography",
// "Drawing", "Sports", "Music", "Travel", "Gardening"
// ],
// music: [
// "Pop", "Rock", "Jazz", "Classical", "Hip-Hop",
// "Electronic", "Country", "R&B", "Folk", "Reggae"
// ],
// emotions: [
// "joy", "anger", "envy", "fear", "sadness",
// "ennui", "disgust", "shame", "anxiety"
// ]
// };

// const RepeatButton = ({ onClick }: { onClick: () => void }) => (
// <button
// aria-label="Spin again"
// onClick={onClick}
// className="appearance-none border-none bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full cursor-pointer transition-colors mt-4"
// >
// 🎰 Spin Again
// </button>
// );

// type SpinnerProps = {
// onFinish: (iconIndex: number) => void;
// timer: number;
// spriteIndex: number;
// };

// const Spinner = forwardRef(({ onFinish, timer, spriteIndex }: SpinnerProps, ref) => {
// const [position, setPosition] = useState(0);
// const timerRef = useRef<NodeJS.Timeout | null>(null);
// const iconCount = ICON_COUNTS[spriteIndex];
// const spriteHeight = iconCount * ICON_HEIGHT;
// const finalIconRef = useRef(0);

// const reset = useCallback(() => {
// if (timerRef.current) clearInterval(timerRef.current);
// const randomFinalIcon = Math.floor(Math.random() * iconCount);
// finalIconRef.current = randomFinalIcon;
// const middle = (3 * ICON_HEIGHT) / 2;
// const center = (randomFinalIcon * ICON_HEIGHT) + ICON_HEIGHT / 2;
// const endPos = middle - center;
// const startPos = endPos + spriteHeight * 4;
// setPosition(startPos);
// let t = timer;
// timerRef.current = setInterval(() => {
// if (t <= 0) {
// clearInterval(timerRef.current!);
// setTimeout(() => onFinish(finalIconRef.current), 0);
// } else {
// setPosition(p => p - ICON_HEIGHT / 2);
// t -= 50;
// }
// }, 50);
// }, [timer, iconCount, spriteHeight, onFinish]);

// useEffect(() => { reset(); return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, [reset]);
// useImperativeHandle(ref, () => ({ reset }), [reset]);

// return (
// <div className="relative w-[100px] h-[300px] overflow-hidden border-2 border-white/30 rounded-lg mx-1 bg-white/10 backdrop-blur-sm">
// <div
// style={{
// backgroundImage: `url(${SPRITE_IMAGES[spriteIndex]})`,
// backgroundPosition: `0px ${position}px`,
// backgroundRepeat: "repeat-y",
// backgroundSize: `${ICON_HEIGHT}px auto`,
// width: `${ICON_HEIGHT}px`,
// height: `${spriteHeight}px`,
// }}
// className="absolute top-0 left-0 transition-none"
// />
// <div className="absolute top-24 left-0 right-0 h-24 border-y-2 border-yellow-400/60 pointer-events-none" />
// <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 pointer-events-none" />
// </div>
// );
// });

// Spinner.displayName = "Spinner";

// export default function SlotMachine() {
// const [results, setResults] = useState<number[]>([]);
// const [isSpinning, setIsSpinning] = useState(false);
// const spinnerRefs = useRef<any[]>([]);

// const handleFinish = useCallback((iconIndex: number) => {
// setResults(prev => {
// const updated = [...prev, iconIndex];
// if (updated.length === 3) setIsSpinning(false);
// return updated;
// });
// }, []);

// const handleSpin = () => {
// setIsSpinning(true);
// setResults([]);
// spinnerRefs.current.forEach((spinner) => spinner?.reset());
// };

// const getResultText = (categoryIndex: number, iconIndex: number) => {
// const categories = ['hobbies', 'music', 'emotions'] as const;
// const category = categories[categoryIndex];
// return RESULT_TEXTS[category][iconIndex] || `Icon ${iconIndex}`;
// };

// const getImage = (category: string, name: string) => {
// const fileName = name.toLowerCase().replace(/[^a-z]/g, "-");
// return `/generated/${category}-${fileName}.webp`;
// };

// return (
// <div className="relative min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 font-sans flex flex-col items-center justify-center p-4">
// <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20 max-w-2xl w-full transition-all duration-500 ease-out scale-100 hover:scale-105">
// <h1 className="text-white text-3xl text-center mb-8 font-bold">🎰 Personal Slot Machine</h1>

// <div className="flex justify-center items-center gap-4 mb-8 p-6 bg-white/5 rounded-2xl">
// {["🎨 Hobbies", "🎵 Music", "😊 Emotion"].map((label, i) => (
// <div key={i} className="text-center">
// <div className="text-white text-sm mb-3 font-semibold">{label}</div>
// <Spinner onFinish={handleFinish} timer={1000 + i * 400} spriteIndex={i} ref={el => spinnerRefs.current[i] = el} />
// </div>
// ))}
// </div>

// {results.length === 3 && (
// <div className="bg-white/10 rounded-2xl p-6 mb-6 border border-white/20 transition-all duration-700 ease-out transform hover:scale-105">
// <h2 className="text-white text-xl font-bold text-center mb-4">Your Results:</h2>
// <div className="grid grid-cols-3 gap-4 text-center">
// {[0, 1, 2].map((i) => (
// <div key={i} className="bg-white/10 rounded-lg p-3">
// <div className="text-yellow-300 font-semibold text-sm">
// {i === 0 ? "🎨 Hobby" : i === 1 ? "🎵 Music" : "😊 Emotion"}
// </div>
// <img src={getImage(['hobbies', 'music', 'emotions'][i], getResultText(i, results[i]))} alt="Result image" className="mx-auto mt-2 rounded-md w-16 h-16 object-cover" />
// <div className="text-white text-lg font-bold mt-2">
// {getResultText(i, results[i])}
// </div>
// </div>
// ))}
// </div>
// <div className="text-center text-white/70 text-sm mt-4">
// Try this combination: {getResultText(0, results[0])} while listening to {getResultText(1, results[1])} music when you're feeling {getResultText(2, results[2]).toLowerCase()}!
// </div>
// </div>
// )}

// <div className="text-center">
// <RepeatButton onClick={handleSpin} />
// {isSpinning && <div className="text-white/70 text-sm mt-2">🎲 Spinning...</div>}
// </div>

// <div className="text-center text-white/60 text-xs mt-6">
// <p>Each spin gives you a personalized activity suggestion!</p>
// <p className="mt-1">Icons: Hobbies ({ICON_COUNTS[0]}) • Music ({ICON_COUNTS[1]}) • Emotions ({ICON_COUNTS[2]})</p>
// </div>
// </div>
// </div>
// );
// }
