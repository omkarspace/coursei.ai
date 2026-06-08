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
      <div className="px-10 md:px-20 lg:px-44">
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
