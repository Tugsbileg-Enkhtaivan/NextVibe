import {
    SignInButton,
    SignUpButton,
    SignedIn,
    SignedOut,
    UserButton,
} from '@clerk/nextjs'
import { Menu } from 'lucide-react'

const Header = () => {
    return (
        <header className="max-w-[430px] w-full flex justify-end items-center p-4 gap-4 h-16 bg-transparent text-white fixed top-0 z-20">
            <SignedOut>
                <SignInButton />
                <SignUpButton />
            </SignedOut>
            <SignedIn>
                <UserButton />
            </SignedIn>

            {/* <Menu /> */}

        </header>
    )
}

export default Header