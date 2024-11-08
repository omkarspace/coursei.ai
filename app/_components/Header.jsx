import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
function header() {
  return (
    <div className='flex justify-between p-5 shadow-md'>
        <Image src={'/logo.svg'} width={100} height={100} />
        <Link href={'/dashboard'}>
        <Button>Get started</Button>
        </Link>
    </div>
  )
}

export default header