'use client';
import React, { useState } from 'react';
import SideBar from './_components/SideBar';
import Header from './_components/Header';
import { UserCourseListContext } from '../_context/UserCourseListContext';
import { TooltipProvider } from '@/components/ui/tooltip';

function DashboardLayout({ children }) {
  const [UserCourseList, setUserCourseInput] = useState([]);
  return (
    <UserCourseListContext.Provider value={{ UserCourseList, setUserCourseInput }}>
      <TooltipProvider delayDuration={300}>
        <div className="min-h-screen dark:bg-gray-950">
          <SideBar />
          <div className="md:ml-64">
            <Header />
            <div className="p-4 md:p-10">{children}</div>
          </div>
        </div>
      </TooltipProvider>
    </UserCourseListContext.Provider>
  );
}

export default DashboardLayout;
