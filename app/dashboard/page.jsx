"use client";

import React from "react";
import AddCourse from "./_components/AddCourse";
import UserCourseList from "./_components/UserCourseList";

function Dashboard() {
  return (
    <div className="min-h-screen dark:bg-gray-950">
      <AddCourse />
      <UserCourseList />
    </div>
  );
}

export default Dashboard;
