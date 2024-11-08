import CategoryList from '@/app/_shared/CategoryList'
import Image from 'next/image'
import React, { useContext } from 'react'
import { UserInputContext } from '@/app/_context/UserInputContext'
function SelectCategory() {
  const {userCourseInput,setUserCourseInput}=useContext(UserInputContext)

  const handleCategoryChange=(category)=>{
    setUserCourseInput(prev=>({
      ...prev,
      category:category
    }))
  };

  return (
    <div className='px-4 sm:px-8 md:px-16 lg:px-20'> 
      <h2 className='my-5 text-lg md:text-xl lg:text-2xl font-semibold'>Select the code Category</h2>
    <div className='grid grid-cols-3 gap-10 '>
      
        {CategoryList.map((item,index)=>(
        <div className={`flex flex-col p-5 border items-center  rounded-xl hover:border-primary hover:bg-purple-50  cursor-pointer ${userCourseInput?.category==item.name&& 'border-primary bg-purple-50'} `}
        onClick={()=>handleCategoryChange(item.name)}
        >
            <Image src={item.icon} width={50} height={50} />
            <h2>{item.name}</h2>
        </div>
    ))}
    </div>
    </div>
  );
}

export default SelectCategory