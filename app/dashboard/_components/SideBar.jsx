'use client';
import { UserCourseListContext } from '@/app/_context/UserCourseListContext';
import { Progress } from '@/components/ui/progress';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useContext, useState } from 'react';
import { useClerk } from '@clerk/nextjs';
import {
  HiOutlineCurrencyRupee,
  HiOutlineHome,
  HiMiniMagnifyingGlass,
  HiOutlineArrowRightOnRectangle,
  HiMiniBars3,
  HiXMark,
} from 'react-icons/hi2';

function SideBar() {
  const { UserCourseList } = useContext(UserCourseListContext);
  const path = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  const Menu = [
    { id: 1, name: 'Home', icon: <HiOutlineHome aria-hidden="true" />, path: '/dashboard' },
    {
      id: 2,
      name: 'Explore',
      icon: <HiMiniMagnifyingGlass aria-hidden="true" />,
      path: '/dashboard/explore',
    },
  ];

  const SidebarContent = () => (
    <>
      <div className="flex justify-center mb-4">
        <Link href="/dashboard" aria-label="Go to dashboard">
          <Image src="/logoban.png" width={160} height={100} alt="Coursei.ai" />
        </Link>
      </div>

      <hr className="my-4 border-gray-200 dark:border-gray-700" />

      <ul className="flex flex-col gap-1" role="list">
        {Menu.map((item) => (
          <li key={item.id}>
            <Link
              href={item.path}
              className={`flex items-center gap-3 text-[#5F2A95] dark:text-purple-400 p-3 cursor-pointer rounded-lg transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-white ${
                item.path === path
                  ? 'bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-white font-semibold'
                  : ''
              }`}
              aria-current={item.path === path ? 'page' : undefined}
              onClick={() => setIsMobileOpen(false)}
            >
              <span className="text-xl md:text-2xl">{item.icon}</span>
              <span className="text-sm md:text-base">{item.name}</span>
            </Link>
          </li>
        ))}
        <li>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-[#5F2A95] dark:text-purple-400 p-3 cursor-pointer rounded-lg transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-white w-full"
          >
            <span className="text-xl md:text-2xl">
              <HiOutlineArrowRightOnRectangle aria-hidden="true" />
            </span>
            <span className="text-sm md:text-base">Logout</span>
          </button>
        </li>
      </ul>

      <div className="absolute bottom-6 left-0 w-full px-4 md:w-[85%]">
        <Progress
          value={((UserCourseList?.length || 0) / 5) * 100}
          className="bg-slate-200 dark:bg-gray-700"
          aria-label={`${UserCourseList?.length || 0} of 5 courses created`}
        />
        <div className="text-[#5F2A95] dark:text-purple-400 mt-2 text-xs md:text-sm">
          <p>{UserCourseList?.length || 0} out of 5 Courses created</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            Upgrade your plan for unlimited course generation
          </p>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
      >
        {isMobileOpen ? (
          <HiXMark className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        ) : (
          <HiMiniBars3 className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        )}
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <nav
        className={`md:hidden fixed h-full w-64 p-4 shadow-lg bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50 transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Dashboard navigation"
      >
        <SidebarContent />
      </nav>

      {/* Desktop sidebar */}
      <nav
        className="hidden md:block fixed h-full w-64 p-4 shadow-lg bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700"
        aria-label="Dashboard navigation"
      >
        <SidebarContent />
      </nav>
    </>
  );
}

export default SideBar;
