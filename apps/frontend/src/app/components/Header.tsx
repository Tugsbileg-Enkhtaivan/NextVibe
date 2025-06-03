import { SignInButton, SignUpButton, UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { LogIn, Menu, UserPlus } from "lucide-react";
import MenuComponent from "./Menu";

export default function Header() {
    return (
        <header className="max-w-[430px] w-full flex justify-end items-center p-4 gap-2 h-16 bg-transparent text-white fixed top-0 z-20">
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

                <MenuComponent />

            </SignedIn>

        </header>
    );
}