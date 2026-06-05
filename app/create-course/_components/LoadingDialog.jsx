import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Image from 'next/image';

function LoadingDialog({ loading }) {
  return (
    <Dialog open={loading}>
      <DialogContent className="max-w-sm sm:max-w-md lg:max-w-lg mx-auto px-4 py-6 sm:py-10">
        <DialogHeader>
          <DialogTitle className="sr-only">Generating your course</DialogTitle>
          <DialogDescription>
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
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

export default LoadingDialog;
