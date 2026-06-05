import React, { useContext } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserInputContext } from '@/app/_context/UserInputContext';

function SelectOption() {
  const { userCourseInput, setUserCourseInput } = useContext(UserInputContext);

  const handleInputChange = (fieldName, value) => {
    setUserCourseInput((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  return (
    <div className="px-6 sm:px-10 md:px-20 lg:px-44">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <Label
            htmlFor="difficulty-level"
            className="text-lg sm:text-xl font-semibold text-[#5F2A95] dark:text-purple-400"
          >
            Difficulty Level
          </Label>
          <Select
            onValueChange={(value) => handleInputChange('level', value)}
            defaultValue={userCourseInput?.level}
          >
            <SelectTrigger
              id="difficulty-level"
              className="h-14 text-lg dark:bg-gray-800 dark:border-gray-700"
            >
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Advance">Advance</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label
            htmlFor="course-duration"
            className="text-lg sm:text-xl font-semibold text-[#5F2A95] dark:text-purple-400"
          >
            Course Duration
          </Label>
          <Select
            onValueChange={(value) => handleInputChange('duration', value)}
            defaultValue={userCourseInput?.duration}
          >
            <SelectTrigger
              id="course-duration"
              className="h-14 text-lg dark:bg-gray-800 dark:border-gray-700"
            >
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
              <SelectItem value="1 Hour">1 Hour</SelectItem>
              <SelectItem value="2 Hours">2 Hours</SelectItem>
              <SelectItem value="More Than 2 Hours">More Than 2 Hours</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label
            htmlFor="add-video"
            className="text-lg sm:text-xl font-semibold text-[#5F2A95] dark:text-purple-400"
          >
            Add Video
          </Label>
          <Select
            onValueChange={(value) => handleInputChange('displayVideo', value)}
            defaultValue={userCourseInput?.displayVideo}
          >
            <SelectTrigger
              id="add-video"
              className="h-14 text-lg dark:bg-gray-800 dark:border-gray-700"
            >
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
              <SelectItem value="Yes">Yes</SelectItem>
              <SelectItem value="No">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label
            htmlFor="no-of-chapters"
            className="text-lg sm:text-xl font-semibold text-[#5F2A95] dark:text-purple-400"
          >
            No. of Chapters
          </Label>
          <Input
            id="no-of-chapters"
            type="number"
            min="1"
            max="10"
            className="h-14 text-lg dark:bg-gray-800 dark:border-gray-700"
            defaultValue={userCourseInput?.noOfChapter}
            onChange={(event) => handleInputChange('noOfChapter', event.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

export default SelectOption;
