import React from 'react';
import AddCourse from './_components/AddCourse';
import UserCourseList from './_components/UserCourseList';
import DueFlashcardCount from './_components/DueFlashcardCount';

function Dashboard() {
  return (
    <div className="min-h-screen dark:bg-gray-950">
      <AddCourse />
      <div className="px-10 md:px-20 lg:px-44">
        <DueFlashcardCount />
      </div>
      <UserCourseList />
    </div>
  );
}

export default Dashboard;
