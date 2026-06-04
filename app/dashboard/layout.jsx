'use client';
import React, { useState } from 'react';
import SideBar from './_components/SideBar';
import Header from './_components/Header';
import { UserCourseListContext } from '../_context/UserCourseListContext';

function DashboardLayout({ children }) {
  const [UserCourseList, setUserCourseInput] = useState([]);
  return (
    <UserCourseListContext.Provider value={{ UserCourseList, setUserCourseInput }}>
      <div className="min-h-screen dark:bg-gray-950">
        <SideBar />
        <div className="md:ml-64">
          <Header />
          <div className="p-4 md:p-10">{children}</div>
        </div>
      </div>
    </UserCourseListContext.Provider>
  );
}

export default DashboardLayout;
