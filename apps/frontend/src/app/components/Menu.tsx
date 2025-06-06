"use client";

import { useState, useRef, useEffect } from "react";
import { Heart, History, Menu } from "lucide-react";

import * as React from "react";
import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

type Checked = DropdownMenuCheckboxItemProps["checked"];

function MenuBar() {
  const [isOpen, setIsOpen] = useState(false);
  const menubarRef = useRef<HTMLDivElement | null>(null);

  // const [showStatusBar, setShowStatusBar] = React.useState<Checked>(false);
  // const [showActivityBar, setShowActivityBar] = React.useState<Checked>(false);
  // const [showPanel, setShowPanel] = React.useState<Checked>(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menubarRef.current &&
        event.target instanceof Node &&
        !menubarRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      setTimeout(() => {
        document.addEventListener("click", handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative">
      {/* <button>
        <Menu className="cursor-pointer" size={24} />
      </button> */}

      {/* Fade/Slide Transition */}
      {/* <div
        ref={menubarRef}
        className={`absolute top-12 right-0 w-fit bg-white rounded-lg shadow-lg z-50 transition-all duration-500 transform
        ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
        }
        `}
      >
        <a
          href="/history"
          onClick={() => setIsOpen(false)}
          className="w-full py-2 px-5 hover:bg-green-500 hover:text-white hover:text-xl flex gap-2 justify-end items-center text-orange-500"
        >
          History <History size={20} />
        </a>
        <hr className="w-[90%] mx-auto" />
        <a
          href="/favorite"
          onClick={() => setIsOpen(false)}
          className="w-full text-red-500 text-red py-2 px-5 hover:bg-violet-500 hover:text-white hover:text-xl flex gap-2 justify-end items-center"
        >
          Favorite <Heart color="red" fill="red" size={18} />
        </a>
      </div> */}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <Menu color="black" size={24} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-36">
          {/* <DropdownMenuLabel>Appearance</DropdownMenuLabel> */}
          {/* <DropdownMenuSeparator /> */}
          <Link href="/history">
            <DropdownMenuCheckboxItem
            // checked={showStatusBar}
            // onCheckedChange={setShowStatusBar}
            >
              History
            </DropdownMenuCheckboxItem>
          </Link>
          <Link href="/favorite">
            <DropdownMenuCheckboxItem
            // checked={showActivityBar}
            // onCheckedChange={setShowActivityBar}
            >
              Favorite
            </DropdownMenuCheckboxItem>
          </Link>
          {/* <DropdownMenuCheckboxItem
            checked={showPanel}
            onCheckedChange={setShowPanel}
          >
            Panel
          </DropdownMenuCheckboxItem> */}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default MenuBar;
