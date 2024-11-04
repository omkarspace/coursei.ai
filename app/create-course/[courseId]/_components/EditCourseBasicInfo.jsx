import React, { useState } from 'react'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
import { HiPencilSquare } from 'react-icons/hi2'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
  

function EditCourseBasicInfo({course}) {

    const [name,setName]=useState();
    const [description,setDescription]=useState();

    const onUpdateHandler=()=>{
        course.courseOutput.course.name=name;
        course.courseOutput.course.description=description;
        console.log(course);

    }
  return (
    <Dialog>
        <DialogTrigger><HiPencilSquare /></DialogTrigger>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>Edit Course Title & Description</DialogTitle>
            <DialogDescription>
                <div className='mt-3'>
                    <label>Course Title</label>
                    <Input defaultValue={course?.courseOutput?.course?.name}
                    onChange={(event)=>setName(event?.target.value)}   />

                </div>
                <div>
                    <label>Description</label>
                    <Textarea className="h-40" defaultValue={course?.courseOutput?.course?.description}
                    onChange={(event)=>setDescription(event?.target.value)}  />
                </div>
            </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <DialogClose>
                    <Button onClick={onUpdateHandler} > Update</Button>
                </DialogClose>

            </DialogFooter>
        </DialogContent>
</Dialog>

  )
}

export default EditCourseBasicInfo