import { UserInputContext } from "@/app/_context/UserInputContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import React, { useContext } from "react";

function TopicDescription() {
  const { userCourseInput, setUserCourseInput } = useContext(UserInputContext);

  const handleInputChange = (fieldName, value) => {
    setUserCourseInput((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  return (
    <div className="mx-4 sm:mx-8 md:mx-16 lg:mx-44">
      <div className="mt-5">
        <label className="block text-lg sm:text-xl font-semibold mb-2 text-[#5F2A95]">
        Please specify the topic for code generation (e.g., Python, Yoga, etc.):
        </label>
        <Input
          placeholder={"Topic"}
          className="h-12 sm:h-14 text-lg sm:text-xl"
          defaultValue={userCourseInput?.topic}
          onChange={(e) => handleInputChange("topic", e.target.value)}
        />
      </div>
      <div className="mt-5">
        <label className="block text-lg sm:text-xl font-semibold mb-2 text-[#5F2A95]">
        Please provide more details about your course and the content you wish to include.
        </label>
        <Textarea
          placeholder="About your Course"
          className="h-24 sm:h-32 text-lg sm:text-xl"
          defaultValue={userCourseInput?.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
        />
      </div>
    </div>
  );
}

export default TopicDescription;
