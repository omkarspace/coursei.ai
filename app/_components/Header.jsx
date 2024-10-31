import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
function header() {
  return (
    <div className='flex justify-between p-5 shadow-md'>
        <Image src={'/logo.svg'} width={100} height={100} />
        <Button>Get started</Button>
    </div>
  )
}

export default header