"use client";
import { UserCourseListContext } from "@/app/_context/UserCourseListContext";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useContext } from "react";
import {
  HiOutlineCurrencyRupee,
  HiOutlineHome,
  HiMiniMagnifyingGlass,
  HiOutlineUser,
} from "react-icons/hi2";

function SideBar() {
  const { UserCourseList } = useContext(UserCourseListContext);
  const path = usePathname();

  const Menu = [
    { id: 1, name: "Home", icon: <HiOutlineHome aria-hidden="true" />, path: "/dashboard" },
    { id: 2, name: "Explore", icon: <HiMiniMagnifyingGlass aria-hidden="true" />, path: "/dashboard/explore" },
    { id: 3, name: "Upgrade", icon: <HiOutlineCurrencyRupee aria-hidden="true" />, path: "/dashboard/upgrade" },
    { id: 4, name: "Logout", icon: <HiOutlineUser aria-hidden="true" />, path: "/dashboard/logout" },
  ];

  return (
    <nav className="fixed h-full w-full md:w-64 p-4 shadow-lg bg-white border-r border-gray-200" aria-label="Dashboard navigation">
      <div className="flex justify-center mb-4">
        <Link href="/dashboard" aria-label="Go to dashboard">
          <Image src="/logoban.png" width={160} height={100} alt="Coursei.ai" />
        </Link>
      </div>

      <hr className="my-4 border-gray-300" />

      <ul className="flex flex-col gap-1" role="list">
        {Menu.map((item) => (
          <li key={item.id}>
            <Link
              href={item.path}
              className={`flex items-center gap-3 text-[#5F2A95] p-3 cursor-pointer rounded-lg transition-colors duration-200 hover:bg-gray-200 hover:text-gray-800 ${
                item.path === path ? "bg-gray-200 text-gray-800 font-semibold" : ""
              }`}
              aria-current={item.path === path ? "page" : undefined}
            >
              <span className="text-xl md:text-2xl">{item.icon}</span>
              <span className="text-sm md:text-base">{item.name}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="absolute bottom-6 left-0 w-full px-4 md:w-[85%]">
        <Progress
          value={((UserCourseList?.length || 0) / 5) * 100}
          className="bg-slate-200"
          aria-label={`${UserCourseList?.length || 0} of 5 courses created`}
        />
        <div className="text-[#5F2A95] mt-2 text-xs md:text-sm">
          <p>
            {UserCourseList?.length || 0} out of 5 Courses created
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Upgrade your plan for unlimited course generation
          </p>
        </div>
      </div>
    </nav>
  );
}

export default SideBar;
