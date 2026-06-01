import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import ThemeToggle from "@/app/_components/ThemeToggle";

function Header() {
  return (
    <header className="flex justify-between items-center p-5 shadow-sm dark:bg-gray-900" role="banner">
      <Link href="/dashboard" aria-label="Go to dashboard">
        <Image src="/logo.png" width={50} height={50} alt="Coursei.ai logo" />
      </Link>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}

export default Header;
