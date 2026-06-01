import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import React from "react";

function Header() {
  return (
    <header className="flex justify-between items-center p-5 shadow-sm" role="banner">
      <Link href="/dashboard" aria-label="Go to dashboard">
        <Image src="/logo.png" width={50} height={50} alt="Coursei.ai logo" />
      </Link>
      <UserButton afterSignOutUrl="/" />
    </header>
  );
}

export default Header;
