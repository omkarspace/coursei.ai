'use client';
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { HiPencilSquare } from 'react-icons/hi2';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { updateCourseNameAndDescription } from '@/app/actions/course';
import { toast } from 'sonner';

function EditCourseBasicInfo({ course, refreshData }) {
  const [name, setName] = useState();
  const [description, setDescription] = useState();
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (course?.courseOutput?.course) {
      setName(course.courseOutput.course.name || '');
      setDescription(course.courseOutput.course.description || '');
    }
  }, [course]);

  const onUpdateHandler = async () => {
    setIsUpdating(true);
    try {
      await updateCourseNameAndDescription(course?.courseId, name, description);
      toast.success('Course updated successfully');
      refreshData?.();
    } catch (error) {
      toast.error('Failed to update course');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="inline-flex items-center justify-center p-1 hover:bg-gray-100 rounded-md transition-colors"
          aria-label="Edit course title and description"
        >
          <HiPencilSquare className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Course Title & Description</DialogTitle>
          <DialogDescription>
            Make changes to your course title and description below.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label htmlFor="course-name" className="block text-sm font-medium mb-1">
              Course Title
            </label>
            <Input
              id="course-name"
              defaultValue={course?.courseOutput?.course?.name}
              onChange={(event) => setName(event?.target.value)}
            />
          </div>
          <div>
            <label htmlFor="course-description" className="block text-sm font-medium mb-1">
              Description
            </label>
            <Textarea
              id="course-description"
              className="h-40"
              defaultValue={course?.courseOutput?.course?.description}
              onChange={(event) => setDescription(event?.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={onUpdateHandler} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Update'}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EditCourseBasicInfo;
