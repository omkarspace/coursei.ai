"use client";
import { UserCourseListContext } from "@/app/_context/UserCourseListContext";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useContext } from "react";
import {
  HiCurrencyRupee,
  HiMiniMagnifyingGlass,
  HiMiniUser,
  HiOutlineCurrencyRupee,
  HiOutlineHome,
  HiOutlineUser,
  HiSquare3Stack3D,
} from "react-icons/hi2";

function SideBar() {
  const { UserCourseList, setUserCourseInput } = useContext(UserCourseListContext);
  const path = usePathname();

  // Define the menu items
  const Menu = [
    { id: 1, name: "Home", icon: <HiOutlineHome />, path: "/dashboard" },
    { id: 2, name: "Explore", icon: <HiMiniMagnifyingGlass />, path: "/dashboard/explore" },
    { id: 3, name: "Upgrade", icon: <HiOutlineCurrencyRupee />, path: "/dashboard/upgrade" },
    { id: 4, name: "Logout", icon: <HiOutlineUser />
      , path: "/dashboard/logout" },
  ];

  return (
    <div className="fixed h-full w-full md:w-64 p-4 shadow-lg bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex justify-center mb-4">
        <Image src={"/logoban.png"} width={160} height={100} alt="Logo" />
      </div>

      {/* Divider */}
      <hr className="my-4 border-gray-300" />

      {/* Menu List */}
      <ul className="flex flex-col gap-1">
        {Menu.map((item) => (
          <Link key={item.id} href={item.path}>
            <div
              className={`flex items-center gap-3 text-[#5F2A95] p-3 cursor-pointer rounded-lg transition-colors duration-200 
              hover:bg-gray-200 hover:text-gray-800 
              ${item.path === path ? "bg-gray-200 text-gray-800 font-semibold" : ""}`}
            >
              <div className="text-xl md:text-2xl">{item.icon}</div>
              <h2 className="text-sm md:text-base">{item.name}</h2>
            </div>
          </Link>
        ))}
      </ul>

      {/* Progress & Course Info */}
      <div className="absolute  bottom-6 left-0 w-full px-4 md:w-[85%]">
        <Progress value={(UserCourseList?.length / 5) * 100} className="bg-slate-200 " />
        <div className="text-[#5F2A95] mt-2 text-xs md:text-sm">
          <p>
            {UserCourseList?.length || 0} out of 5 Courses created
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Upgrade your plan for unlimited course generation
          </p>
        </div>
      </div>
    </div>
  );
}

export default SideBar;
