"use client"

import { SignInButton, SignUpButton, UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { Home, LogIn, UserPlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import MenuBar from "./Menu";
import Link from "next/link";

export default function Header() {
    const [open, setOpen] = useState(false);
    const [showHeader, setShowHeader] = useState(true);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (Math.abs(currentScrollY - lastScrollY.current) < 10) return;

            if (currentScrollY > lastScrollY.current) {
                setShowHeader(false);
            } else {
                setShowHeader(true);
            }

            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className={`max-w-4xl w-full flex items-center p-4 gap-2 h-13 bg-transparent text-white absolute top-0 left-0 z-20 justify-between sm:px-8 transition-transform duration-300 ${showHeader ? "translate-y-0" : "-translate-y-full"}`}>
            <div className="w-full h-full opacity-2 bg-black pointer-events-none absolute top-0 left-0"></div>

            <Link href="/">
                {/* <img src="/assets/logo-4.webp" className="w-30" />› */}
                <Home size={28} />
            </Link>

            <div className="flex items-center gap-2">
                <SignedOut>
                    {/* Sign In Icon Button */}
                    <SignInButton mode="modal">
                        <button className="p-2 rounded-full hover:bg-gray-200 transition bg-white cursor-pointer">
                            <LogIn size={20} color="black" />
                        </button>
                    </SignInButton>

                    {/* Sign Up Icon Button */}
                    <SignUpButton mode="modal">
                        <button className="p-2 rounded-full hover:bg-gray-200 transition bg-white cursor-pointer">
                            <UserPlus size={20} color="black" />
                        </button>
                    </SignUpButton>
                </SignedOut>

                <SignedIn>
                    <UserButton
                        appearance={{
                            elements: {
                                userButtonBox: "p-1 rounded-full hover:bg-white/10 transition",
                            },
                        }}
                    />

                    <MenuBar />

                </SignedIn>
            </div>

        </header>
    );
}