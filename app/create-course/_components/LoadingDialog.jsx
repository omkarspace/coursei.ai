import React from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog"
import Image from 'next/image'

function LoadingDialog({ loading }) {
  return (
    <AlertDialog open={loading}>
      <AlertDialogContent className="max-w-sm sm:max-w-md lg:max-w-lg mx-auto px-4 py-6 sm:py-10">
        <AlertDialogHeader>
          <AlertDialogDescription>
            <div className="flex flex-col items-center py-6 sm:py-8">
              <Image 
                src={'/loader.gif'} 
                width={80} 
                height={80} 
                alt="Loading..." 
                className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28"
              />
              <h2 className="text-base sm:text-lg md:text-xl text-center mt-4">
                Please wait... AI is working on your course
              </h2>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default LoadingDialog
