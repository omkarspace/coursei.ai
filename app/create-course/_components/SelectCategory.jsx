import CategoryList from '@/app/_shared/CategoryList';
import Image from 'next/image';
import React, { useContext } from 'react';
import { UserInputContext } from '@/app/_context/UserInputContext';

function SelectCategory() {
  const { userCourseInput, setUserCourseInput } = useContext(UserInputContext);

  const handleCategoryChange = (category) => {
    setUserCourseInput((prev) => ({
      ...prev,
      category: category,
    }));
  };

  return (
    <div className="px-4 sm:px-8 md:px-16 lg:px-20">
      <h2 className="my-5 text-lg sm:text-xl font-semibold text-center text-[#5F2A95] dark:text-purple-400">
        Choose Course Category
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
        {CategoryList.map((item, index) => (
          <div
            key={index}
            className={`flex flex-col p-4 border items-center rounded-xl cursor-pointer transition-all hover:border-primary hover:bg-purple-50 dark:hover:bg-purple-900/20 ${
              userCourseInput?.category === item.name
                ? 'border-primary bg-purple-50 dark:bg-purple-900/30 ring-2 ring-primary'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
            }`}
            onClick={() => handleCategoryChange(item.name)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCategoryChange(item.name);
              }
            }}
            role="button"
            tabIndex={0}
            aria-pressed={userCourseInput?.category === item.name}
          >
            <Image src={item.icon} width={50} height={50} alt={item.name} />
            <h2 className="mt-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
              {item.name}
            </h2>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SelectCategory;
