import React from 'react'
import { NavbarClean } from '@/src/components/layout/navbar-clean'
import UserSignupConfirmView from '@/src/modules/auth/views/user-signup-confirm.view'

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

const page = async ({ params }: PageProps) => {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  return (
    <div className="bg-[#020617] min-h-screen flex flex-col">
        <NavbarClean />
        <UserSignupConfirmView slug={slug} />
    </div>
  )
}

export default page