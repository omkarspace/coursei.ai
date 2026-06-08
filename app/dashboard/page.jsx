import React from 'react';
import AddCourse from './_components/AddCourse';
import UserCourseList from './_components/UserCourseList';
import DueFlashcardCount from './_components/DueFlashcardCount';
import DueQuizCount from '@/app/_components/DueQuizCount';
import ReviewStreak from './_components/ReviewStreak';
import ContinueLearning from './_components/ContinueLearning';

function Dashboard() {
  return (
    <div className="min-h-screen dark:bg-gray-950">
      <AddCourse />
      <div className="px-4 md:px-8 lg:px-12 max-w-7xl mx-auto">
        <ContinueLearning />
        <ReviewStreak />
        <DueFlashcardCount />
        <DueQuizCount />
      </div>
      <UserCourseList />
    </div>
  );
}

export default Dashboard;
