import React, { useContext } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { UserInputContext } from "@/app/_context/UserInputContext";

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-10">
        <div>
          <label className="text-lg sm:text-xl font-semibold text-[#5F2A95]">Difficulty Level</label>
          <Select onValueChange={(value) => handleInputChange("level", value)}
            defaultValue={userCourseInput?.level}>
            <SelectTrigger className="h-14 text-lg">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Advance">Advance</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-lg sm:text-xl font-semibold text-[#5F2A95]">Course Duration</label>
          <Select
            onValueChange={(value) => handleInputChange("duration", value)}
            defaultValue={userCourseInput?.duration}>
            <SelectTrigger className="h-14 text-lg">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1 Hour">1 Hour</SelectItem>
              <SelectItem value="2 Hours">2 Hours</SelectItem>
              <SelectItem value="More Than 2 Hours">
                More Than 2 Hours
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-lg sm:text-xl font-semibold text-[#5F2A95]">Add Video</label>
          <Select
            onValueChange={(value) => handleInputChange("displayVideo", value)}
            defaultValue={userCourseInput?.displayVideo}>
            <SelectTrigger className="h-14 text-lg">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Yes">Yes</SelectItem>
              <SelectItem value="No">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-lg sm:text-xl font-semibold text-[#5F2A95]">No. of Chapter</label>
          <Input
            type="number"
            className="h-14 text-lg"
            defaultValue={userCourseInput?.noOfChapter}
            onChange={(event) =>
              handleInputChange("noOfChapter", event.target.value)
            }
          />
        </div>
      </div>
    </div>
  );
}

export default SelectOption;
