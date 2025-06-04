"use client";

import { Heart, History, Menu, UserRoundPen } from "lucide-react";
import { useState } from "react";

export default function MenuComponent() {
    const [menu, setMenu] = useState(false);

    return (
        <main>
            <Menu
                onClick={() => setMenu(true)}
                className={`${menu ? "hidden" : "block"} cursor-pointer`}
            />

            {/* Animated Menu */}
            <div
                className={`
                    w-fit h-fit bg-white text-black flex-col rounded-sm
                    transition-transform duration-900 ease-in mt-23 font-[roboto]
                    ${menu ? "translate-x-0 opacity-100 flex" : "translate-x-30 opacity-0 hidden"}
                `}
            >
                <a href="/profile"
                    onClick={() => setMenu(false)}
                    className="w-full py-2 px-5 hover:bg-rose-500 hover:text-white hover:text-xl flex gap-2 justify-end rounded-t-sm scale-105 items-center"
                >
                    Profile <UserRoundPen />
                </a>
                <hr className="w-[90%] mx-auto" />
                <a href="/history"
                    onClick={() => setMenu(false)}
                    className="w-full py-2 px-5 hover:bg-green-500 hover:text-white hover:text-xl flex gap-2 justify-end  scale-105 items-center [&>*]:hover:text-white text-orange-500"
                >
                    History <History className="text-orange-500" size={20} />
                </a>
                <hr className="w-[90%] mx-auto" />
                <a href="/favorite"
                    onClick={() => setMenu(false)}
                    className="w-full py-2 px-5 hover:bg-violet-500 hover:text-white hover:text-xl flex gap-2 justify-end rounded-b-sm  scale-105 items-center"
                >
                    Favorite <Heart color="red" fill="red" size={18} />
                </a>
            </div>
        </main>
    );
}
