import React from 'react'
import { ComingSoon } from '@/src/components/ui/coming-soon';
import { Navbar } from '@/src/components/layout/navbar';

const page = () => {
  return (
    <div className='flex flex-col h-screen bg-[#020617] text-blue-100 font-sans overflow-hidden'>
      <Navbar />
      <ComingSoon title='Audit-Log' description='This feature is currently under development.' />
    </div>
  )
}

export default page