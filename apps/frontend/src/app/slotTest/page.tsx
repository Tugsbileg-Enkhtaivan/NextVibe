"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";

const ICON_NAMES = [
  "reading",
  "running",
  "cooking",
  "traveling",
  "gaming",
  "yoga",
  "biking",
  "dancing",
  "gardening",
];

const ICON_HEIGHT = 320;

const LOSER_MESSAGES = [
  "Not quite",
  "Stop gambling",
  "Hey, you lost!",
  "Ouch! I felt that",
  "Don't beat yourself up",
  "There goes the college fund",
  "I have a cat. You have a loss",
  "You're awesome at losing",
  "Coding is hard",
  "Don't hate the coder",
];

type SpinnerProps = {
  onFinish: (position: number, symbol: string) => void;
  timer: number;
  index: number;
  spriteUrl: string;
};

type SpinnerHandle = {
  reset: () => void;
};

const Spinner = forwardRef<SpinnerHandle, SpinnerProps>(
  ({ onFinish, timer, index, spriteUrl }, ref) => {
    const [position, setPosition] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const multiplierRef = useRef(Math.floor(Math.random() * 3) + 1); // 1 to 3
    const startPositionRef = useRef(
      Math.floor(Math.random() * ICON_NAMES.length) * ICON_HEIGHT * -1
    );
    const speedRef = useRef(ICON_HEIGHT * multiplierRef.current);

    const reset = useCallback(() => {
      if (timerRef.current) clearInterval(timerRef.current);

      startPositionRef.current =
        Math.floor(Math.random() * ICON_NAMES.length) * ICON_HEIGHT * -1;
      multiplierRef.current = Math.floor(Math.random() * 3) + 1;
      speedRef.current = ICON_HEIGHT * multiplierRef.current;

      setPosition(startPositionRef.current);

      let timeRemaining = timer;
      timerRef.current = setInterval(() => {
        timeRemaining -= 100;
        setPosition((prev) => {
          const next = prev - speedRef.current;
          return next < ICON_HEIGHT * (ICON_NAMES.length - 1) * -1 ? 0 : next;
        });

        if (timeRemaining <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);

          // Calculate final symbol
          const finalIndex =
            Math.abs(Math.round((position) / ICON_HEIGHT)) % ICON_NAMES.length;
          const symbol = ICON_NAMES[finalIndex];
          onFinish(position, symbol);
        }
      }, 100);
    }, [onFinish, timer, position]);

    useImperativeHandle(ref, () => ({ reset }), [reset]);

    useEffect(() => {
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }, []);

    return (
      <div
        style={{
          backgroundImage: `url(${spriteUrl})`,
          backgroundPosition: `0px ${position}px`,
          backgroundRepeat: "repeat-y",
          backgroundColor: "#fff",
        }}
        className="icons w-32 h-[480px] overflow-hidden transition-all ease-in-out duration-300 px-20 translate-z-0"
      />
    );
  }
);

Spinner.displayName = "Spinner";

const WinningSound = () => (
  <audio autoPlay className="player" preload="none">
    <source src="https://andyhoffman.codes/random-assets/img/slots/winning_slot.wav" />
  </audio>
);

const RepeatButton = ({ onClick }: { onClick: () => void }) => (
  <button
    aria-label="Play again"
    id="repeatButton"
    onClick={onClick}
    className="appearance-none border-none bg-[url('https://github.com/antibland/codes/blob/gh-pages/random-assets/img/slots/repeat.png?raw=true')] bg-transparent bg-cover w-12 h-12 absolute top-2.5 right-5 cursor-pointer animate-spin-slow mt-10"
  />
);

export default function SlotMachine() {
  const [winner, setWinner] = useState<boolean | null>(null);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [started, setStarted] = useState(false);

  const spinnerRefs = useRef<Array<SpinnerHandle | null>>([]);

  const spriteUrls = [
    "/assets/activity-slot.webp",
    "/assets/slot-mood.webp",
    "/assets/slot-genre.webp",
  ];

  const handleFinish = (position: number, symbol: string) => {
    console.log(`Spinner stopped at symbol: ${symbol}`);

    setSymbols((prev) => {
      const updated = [...prev, symbol];
      if (updated.length === 3) {
        const allMatch = updated.every((s) => s === updated[0]);
        setWinner(allMatch);
        setStarted(false);
      }
      return updated;
    });
  };

  const handleStart = () => {
    setWinner(null);
    setSymbols([]);
    setStarted(true);
    spinnerRefs.current.forEach((spinner) => spinner?.reset());
  };

  const getLoserMessage = () =>
    LOSER_MESSAGES[Math.floor(Math.random() * LOSER_MESSAGES.length)];

  return (
    <div className="relative h-screen bg-[#292929] font-sans">
      {winner && <WinningSound />}

      <h1 className="text-white text-xl text-center pt-6">
        <span className="inline-block px-4 py-3 border border-white/10">
          {winner === null
            ? "Waiting…"
            : winner
            ? "🤑 Pure skill! 🤑"
            : getLoserMessage()}
        </span>
      </h1>

      {!started && (
        <button
          onClick={handleStart}
          className="bg-green-600 text-white px-6 py-2 rounded absolute top-24 left-1/2 -translate-x-1/2 z-10"
        >
          Start Slot Machine
        </button>
      )}

      <div className="spinner-container absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[.62] flex overflow-hidden h-[544px] p-8">
        {spriteUrls.map((spriteUrl, i) => (
          <Spinner
            key={i}
            onFinish={handleFinish}
            timer={[1000, 1400, 2200][i]}
            index={i}
            spriteUrl={spriteUrl}
            ref={(el) => {
              spinnerRefs.current[i] = el;
            }}
          />
        ))}

        <div className="gradient-fade absolute top-8 right-8 bottom-8 left-8 bg-gradient-to-b from-zinc-700 via-transparent to-zinc-700 pointer-events-none" />
      </div>

      {winner !== null && <RepeatButton onClick={handleStart} />}
    </div>
  );
}







// const activityIcons = [
//     "reading",
//     "running",
//     "cooking",
//     "traveling",
//     "gaming",
//     "drawing",
//     "yoga",
//     "biking",
//     "dancing",
//     "gardeging"
// ]

// const moodIcons = [
//     "joy",
//     "anger",
//     "envy",
//     "fear",
//     "sadness",
//     "ennui",
//     "discust",
//     "shame",
//     "love",
//     "surprise"
// ]

// const genreIcons = [
//     "pop",
//     "rock",
//     "hip-hop",
//     "electronic",
//     "soul",
//     "counry",
//     "jazz",
//     "classical",
//     "reggae",
//     "blues"
// ]

// "use client";

// import React, {
//     useState,
//     useEffect,
//     useRef,
//     useCallback,
//     forwardRef,
//     useImperativeHandle,
// } from "react";

// const ICON_HEIGHT = 320;

// const LOSER_MESSAGES = [
//     "Not quite",
//     "Stop gambling",
//     "Hey, you lost!",
//     "Ouch! I felt that",
//     "Don't beat yourself up",
//     "There goes the college fund",
//     "I have a cat. You have a loss",
//     "You're awesome at losing",
//     "Coding is hard",
//     "Don't hate the coder",
// ];



// type SpinnerProps = {
//     onFinish: (position: number) => void;
//     timer: number;
//     index: number;
//     spriteUrl: string;
// };

// type SpinnerHandle = {
//     reset: () => void;
// };

// const Spinner = forwardRef<SpinnerHandle, SpinnerProps>(
//     ({ onFinish, timer, index, spriteUrl }, ref) => {
//         const [position, setPosition] = useState(0);
//         const [timeRemaining, setTimeRemaining] = useState(timer);


//         const timerRef = useRef<NodeJS.Timeout | null>(null);
//         const multiplierRef = useRef(Math.floor(Math.random() * (4 - 1) + 1));
//         const startPositionRef = useRef(
//             Math.floor(Math.random() * 9) * ICON_HEIGHT * -1
//         );
//         const speedRef = useRef(ICON_HEIGHT * multiplierRef.current);

//         const reset = useCallback(() => {
//             if (timerRef.current) clearInterval(timerRef.current);

//             startPositionRef.current =
//                 Math.floor(Math.random() * 9) * ICON_HEIGHT * -1;
//             multiplierRef.current = Math.floor(Math.random() * (4 - 1) + 1);
//             speedRef.current = ICON_HEIGHT * multiplierRef.current;

//             setPosition(startPositionRef.current);
//             setTimeRemaining(timer);

//             timerRef.current = setInterval(() => {
//                 tick();
//             }, 100);
//         }, [timer]);

//         const getSymbolFromPosition = useCallback(() => {
//             const totalSymbols = 10;
//             const maxPosition = ICON_HEIGHT * (totalSymbols - 1) * -1;
//             const moved = (timer / 100) * multiplierRef.current;
//             let currentPosition = startPositionRef.current;

//             for (let i = 0; i < moved; i++) {
//                 currentPosition -= ICON_HEIGHT;
//                 if (currentPosition < maxPosition) {
//                     currentPosition = 0;
//                 }
//             }

//             onFinish(currentPosition);
//         }, [timer, onFinish]);

//         const tick = useCallback(() => {
//             setTimeRemaining((prev) => {
//                 if (prev <= 0) {
//                     if (timerRef.current) clearInterval(timerRef.current);
//                     getSymbolFromPosition();
//                     return 0;
//                 }

//                 setPosition((prevPosition) => prevPosition - speedRef.current);
//                 return prev - 100;
//             });
//         }, [getSymbolFromPosition]);

//         useEffect(() => {
//             return () => {
//                 if (timerRef.current) clearInterval(timerRef.current);
//             };
//         }, []);

//         useImperativeHandle(ref, () => ({ reset }), [reset]);

//         return (
//             <div
//                 style={{
//                     backgroundImage: `url(${spriteUrl})`,
//                     backgroundPosition: `0px ${position}px`,
//                     backgroundRepeat: "repeat-y",
//                     backgroundColor: "#fff",
//                 }}
//                 className="icons w-32 h-[480px] overflow-hidden transition-all ease-in-out duration-300 px-20 translate-z-0"
//             />
//         );
//     }
// );

// Spinner.displayName = "Spinner";

// const WinningSound = () => (
//     <audio autoPlay className="player" preload="none">
//         <source src="https://andyhoffman.codes/random-assets/img/slots/winning_slot.wav" />
//     </audio>
// );

// const RepeatButton = ({ onClick }: { onClick: () => void }) => (
//     <button
//         aria-label="Play again"
//         id="repeatButton"
//         onClick={onClick}
//         className="appearance-none border-none bg-[url('https://github.com/antibland/codes/blob/gh-pages/random-assets/img/slots/repeat.png?raw=true')] bg-transparent bg-cover w-12 h-12 absolute top-2.5 right-5 cursor-pointer animate-spin-slow mt-10"
//     />
// );

// export default function SlotMachine() {
//     const [winner, setWinner] = useState<boolean | null>(null);
//     const [matches, setMatches] = useState<number[]>([]);
//     const [started, setStarted] = useState(false);

//     const spinnerRefs = useRef<Array<SpinnerHandle | null>>([]);

//     const spriteUrls = [
//         "/assets/activity-slot.webp",
//         "/assets/slot-mood.webp",
//         "/assets/slot-genre.webp",
//     ];

//     const handleFinish = (value: number) => {
//         // Defer to avoid state update during render
//         setTimeout(() => {
//             setMatches((prev) => {
//                 const newMatches = [...prev, value];
//                 if (newMatches.length === 3) {
//                     const first = newMatches[0];
//                     const results = newMatches.every((match) => match === first);
//                     setWinner(results);
//                     setStarted(false); // Enable Start button again
//                 }
//                 return newMatches;
//             });
//         }, 0);
//     };


//     const handleStart = () => {
//         setWinner(null);
//         setMatches([]);
//         setStarted(true);
//         spinnerRefs.current.forEach((spinner) => spinner?.reset());
//     };

//     const getLoserMessage = () =>
//         LOSER_MESSAGES[Math.floor(Math.random() * LOSER_MESSAGES.length)];

//     return (
//         <div className="relative h-screen bg-[#292929] font-sans">
//             {winner && <WinningSound />}

//             <h1 className="text-white text-xl text-center pt-6">
//                 <span className="inline-block px-4 py-3 border border-white/10">
//                     {winner === null
//                         ? "Waiting…"
//                         : winner
//                             ? "🤑 Pure skill! 🤑"
//                             : getLoserMessage()}
//                 </span>
//             </h1>

//             {!started && (
//                 <button
//                     onClick={handleStart}
//                     className="bg-green-600 text-white px-6 py-2 rounded absolute top-24 left-1/2 -translate-x-1/2 z-10"
//                 >
//                     Start Slot Machine
//                 </button>
//             )}

//             <div className="spinner-container absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[.62] flex overflow-hidden h-[544px] p-8">
//                 {spriteUrls.map((spriteUrl, i) => (
//                     <Spinner
//                         key={i}
//                         onFinish={handleFinish}
//                         timer={[1000, 1400, 2200][i]}
//                         index={i}
//                         spriteUrl={spriteUrl}
//                         ref={(el) => {
//                             spinnerRefs.current[i] = el;
//                         }}
//                     />
//                 ))}

//                 <div className="gradient-fade absolute top-8 right-8 bottom-8 left-8 bg-gradient-to-b from-zinc-700 via-transparent to-zinc-700 pointer-events-none" />
//             </div>

//             {winner !== null && <RepeatButton onClick={handleStart} />}
//         </div>
//     );
// };



// "use client";

// import React, {
//     useState,
//     useEffect,
//     useRef,
//     useCallback,
//     forwardRef,
//     useImperativeHandle,
// } from "react";

// const ICON_HEIGHT = 320;
// const LOSER_MESSAGES = [
//     "Not quite",
//     "Stop gambling",
//     "Hey, you lost!",
//     "Ouch! I felt that",
//     "Don't beat yourself up",
//     "There goes the college fund",
//     "I have a cat. You have a loss",
//     "You're awesome at losing",
//     "Coding is hard",
//     "Don't hate the coder",
// ];

// const RepeatButton = ({ onClick }: { onClick: () => void }) => (
//     <button
//         aria-label="Play again"
//         id="repeatButton"
//         onClick={onClick}
//         className="appearance-none border-none bg-[url('https://github.com/antibland/codes/blob/gh-pages/random-assets/img/slots/repeat.png?raw=true')] bg-transparent bg-cover w-12 h-12 absolute top-2.5 right-5 cursor-pointer animate-spin-slow mt-10"
//     />
// );

// const WinningSound = () => (
//     <audio autoPlay className="player" preload="none">
//         <source src="https://andyhoffman.codes/random-assets/img/slots/winning_slot.wav" />
//     </audio>
// );

// type SpinnerProps = {
//     onFinish: (position: number) => void;
//     timer: number;
// };

// const Spinner = forwardRef(({ onFinish, timer }: SpinnerProps, ref) => {
//     const [position, setPosition] = useState(0);
//     const [timeRemaining, setTimeRemaining] = useState(timer);
//     const timerRef = useRef<NodeJS.Timeout | null>(null);
//     const multiplierRef = useRef(Math.floor(Math.random() * (4 - 1) + 1));
//     const startPositionRef = useRef(
//         Math.floor(Math.random() * 9) * ICON_HEIGHT * -1
//     );
//     const speedRef = useRef(ICON_HEIGHT * multiplierRef.current);

//     console.log(position, "position")

//     const reset = useCallback(() => {
//         if (timerRef.current) clearInterval(timerRef.current);

//         startPositionRef.current =
//             Math.floor(Math.random() * 9) * ICON_HEIGHT * -1;
//         multiplierRef.current = Math.floor(Math.random() * (4 - 1) + 1);
//         speedRef.current = ICON_HEIGHT * multiplierRef.current;

//         setPosition(startPositionRef.current);
//         setTimeRemaining(timer);

//         timerRef.current = setInterval(() => {
//             tick();
//         }, 100);
//     }, [timer]);

//     const getSymbolFromPosition = useCallback(() => {
//         const totalSymbols = 10;
//         const maxPosition = ICON_HEIGHT * (totalSymbols - 1) * -1;
//         const moved = (timer / 100) * multiplierRef.current;
//         let currentPosition = startPositionRef.current;

//         for (let i = 0; i < moved; i++) {
//             currentPosition -= ICON_HEIGHT;
//             if (currentPosition < maxPosition) {
//                 currentPosition = 0;
//             }
//         }

//         onFinish(currentPosition);
//     }, [timer, onFinish]);

//     const tick = useCallback(() => {
//         setTimeRemaining((prev) => {
//             if (prev <= 0) {
//                 if (timerRef.current) clearInterval(timerRef.current);
//                 getSymbolFromPosition();
//                 return 0;
//             }

//             setPosition((prevPosition) => prevPosition - speedRef.current);
//             return prev - 100;
//         });
//     }, [getSymbolFromPosition]);

//     useEffect(() => {
//         reset();
//         return () => {
//             if (timerRef.current) clearInterval(timerRef.current);
//         };
//     }, [reset]);

//     useImperativeHandle(ref, () => ({ reset }), [reset]);

//     return (
//         <div
//             style={{
//                 backgroundImage:
//                     "url(/assets/slot-mood.webp)",
//                 backgroundPosition: `0px ${position}px`,
//                 backgroundRepeat: "repeat-y",
//                 backgroundColor: "#fff",
//             }}
//             className="icons w-32 h-[564px] overflow-hidden transition-all ease-in-out duration-300 px-20 translate-z-0"
//         />
//     );
// });

// Spinner.displayName = "Spinner";

// export default function SlotMachine() {
//     const [winner, setWinner] = useState<boolean | null>(null);
//     const [matches, setMatches] = useState<number[]>([]);
//     const spinnerRefs = useRef<any[]>([]);

//     const handleFinish = (value: number) => {
//         setMatches((prev) => {
//             const newMatches = [...prev, value];
//             if (newMatches.length === 3) {
//                 const first = newMatches[0];
//                 const results = newMatches.every((match) => match === first);
//                 setWinner(results);
//             }
//             return newMatches;
//         });
//     };

//     const handleClick = () => {
//         setWinner(null);
//         setMatches([]);
//         spinnerRefs.current.forEach((spinner) => spinner?.reset());
//     };

//     const getLoserMessage = () => {
//         return LOSER_MESSAGES[Math.floor(Math.random() * LOSER_MESSAGES.length)];
//     };

//     return (
//         <div className="relative h-screen bg-[#292929] font-sans">
//             {winner && <WinningSound />}

//             <h1 className="text-white text-xl text-center pt-6">
//                 <span className="inline-block px-4 py-3 border border-white/10">
//                     {winner === null
//                         ? "Waiting…"
//                         : winner
//                             ? "🤑 Pure skill! 🤑"
//                             : getLoserMessage()}
//                 </span>
//             </h1>

//             <div className="spinner-container absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[.62] flex overflow-hidden h-[632px] p-8">
//                 <Spinner
//                     onFinish={handleFinish}
//                     timer={1000}
//                     ref={(el) => (spinnerRefs.current[0] = el)}
//                 />
//                 <Spinner
//                     onFinish={handleFinish}
//                     timer={1400}
//                     ref={(el) => (spinnerRefs.current[1] = el)}
//                 />
//                 <Spinner
//                     onFinish={handleFinish}
//                     timer={2200}
//                     ref={(el) => (spinnerRefs.current[2] = el)}
//                 />
//                 <div className="gradient-fade absolute top-8 right-8 bottom-8 left-8 bg-gradient-to-b from-zinc-700 via-transparent to-zinc-700 pointer-events-none" />
//             </div>

//             {winner !== null && <RepeatButton onClick={handleClick} />}
//         </div>
//     );
// }