'use client';
import { Button } from '@/components/ui/button';
import React, { useContext, useState } from 'react';
import { HiClipboardDocumentList, HiLightBulb, HiMiniSquares2X2, HiExclamationTriangle, HiXMark } from 'react-icons/hi2';
import SelectCategory from './_components/SelectCategory';
import TopicDescription from './_components/TopicDescription';
import SelectOption from './_components/SelectOption';
import { UserInputContext } from '../_context/UserInputContext';
import { generateOutlineAction } from '@/app/actions/outline';
import LoadingDialog from './_components/LoadingDialog';
import uuid4 from 'uuid4';
import { useRouter } from 'next/navigation';
import { createCourse } from '../actions/course';
import { toast } from 'sonner';
import TranscriptionInput from '@/app/_components/TranscriptionInput';

function CreateCourse() {
  const StepperOptions = [
    { id: 1, name: 'Category', icon: <HiMiniSquares2X2 /> },
    { id: 2, name: 'Topic & Desc.', icon: <HiLightBulb /> },
    { id: 3, name: 'Options', icon: <HiClipboardDocumentList /> },
  ];

  const { userCourseInput, setUserCourseInput } = useContext(UserInputContext);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState(null);
  const router = useRouter();
  const [creationMode, setCreationMode] = useState('manual');

  const checkStatus = () => {
    if (userCourseInput?.length === 0) return true;
    if (
      activeIndex === 0 &&
      (userCourseInput?.category?.length === 0 || userCourseInput?.category === undefined)
    )
      return true;
    if (
      activeIndex === 1 &&
      (userCourseInput?.topic?.length === 0 || userCourseInput?.topic === undefined)
    )
      return true;
    if (
      activeIndex === 2 &&
      (userCourseInput?.level === undefined ||
        userCourseInput?.duration === undefined ||
        userCourseInput?.displayVideo === undefined ||
        userCourseInput?.noOfChapter === undefined)
    )
      return true;
    return false;
  };

  const GenerateCourseLayout = async () => {
    setLoading(true);
    setError(null);

    try {
      const courseId = uuid4();
      await createCourse({
        courseId,
        name: userCourseInput?.topic,
        level: userCourseInput?.level,
        category: userCourseInput?.category,
        includeVideo: userCourseInput?.displayVideo || 'Yes',
      });
      await generateOutlineAction({
        courseId,
        category: userCourseInput?.category,
        topic: userCourseInput?.topic,
        level: userCourseInput?.level,
        duration: userCourseInput?.duration,
        numChapters: userCourseInput?.noOfChapter || 5,
      });
      router.replace('/create-course/' + courseId + '/outline');
    } catch (err) {
      console.error('Course generation error:', err);
      const errorMessage =
        err && err.message ? err.message : 'Failed to generate course. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen dark:bg-gray-950">
      <div className="flex flex-col justify-center items-center mt-10">
        <h2 className="text-4xl text-primary font-medium">Create Course</h2>
        <div className="flex mt-10">
          {StepperOptions.map((item, index) => (
            <div className="flex items-center" key={item.id}>
              <div className="flex flex-col items-center w-[50px] md:w-[100px]">
                <div
                  className={`bg-gray-200 dark:bg-gray-700 p-3 rounded-full text-white ${
                    activeIndex >= index && 'bg-primary'
                  }`}
                  aria-label={`Step ${index + 1}: ${item.name}`}
                >
                  {item.icon}
                </div>
                <h2 className="hidden md:block md:text-sm dark:text-gray-300">{item.name}</h2>
              </div>
              {index !== StepperOptions.length - 1 && (
                <div
                  className={`h-1 w-[50px] md:w-[100px] rounded-full lg:w-[170px] bg-gray-300 dark:bg-gray-600 ${
                    activeIndex - 1 >= index && 'bg-purple-600'
                  }`}
                ></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div role="alert" aria-live="assertive" className="px-4 md:px-8 lg:px-12 max-w-7xl mx-auto mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-3">
            <HiExclamationTriangle className="w-5 h-5 text-red-500 shrink-0" aria-hidden="true" />
            <p className="text-red-700 dark:text-red-400 text-sm flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto p-1 text-red-500 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
              aria-label="Dismiss error"
            >
              <HiXMark className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <div className="px-4 md:px-8 lg:px-12 max-w-7xl mx-auto mt-10">
        {/* Mode Selector */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setCreationMode('manual')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              creationMode === 'manual'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            Manual Creation
          </button>
          <button
            onClick={() => setCreationMode('transcription')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              creationMode === 'transcription'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            From Audio/Video
          </button>
        </div>

        {creationMode === 'manual' && (
          <>
            {activeIndex === 0 ? (
              <SelectCategory />
            ) : activeIndex === 1 ? (
              <TopicDescription />
            ) : (
              <SelectOption />
            )}

            <div className="flex justify-between mt-10">
              <Button
                disabled={activeIndex === 0}
                variant="outline"
                onClick={() => setActiveIndex(activeIndex - 1)}
              >
                Previous
              </Button>
              {activeIndex < 2 && (
                <Button disabled={checkStatus()} onClick={() => setActiveIndex(activeIndex + 1)}>
                  Next
                </Button>
              )}
              {activeIndex === 2 && (
                <Button disabled={checkStatus() || loading} onClick={() => GenerateCourseLayout()}>
                  {loading ? 'Generating...' : 'Generate Course Layout'}
                </Button>
              )}
            </div>
          </>
        )}

        {creationMode === 'transcription' && (
          <TranscriptionInput
            onTranscriptionComplete={(data) => {
              setUserCourseInput((prev) => ({
                ...prev,
                topic: data.chapters?.[0]?.headline || 'Transcribed Course',
              }));
            }}
          />
        )}

        <LoadingDialog loading={loading} />
      </div>
    </div>
  );
}

export default CreateCourse;
