import React from 'react'
import { NavbarClean } from '@/src/components/layout/navbar-clean'
import UserSignupConfirmView from '@/src/modules/auth/views/user-signup-confirm.view'

const page = () => {
  return (
    <div>
        <NavbarClean />
        <UserSignupConfirmView />
    </div>
  )
}

export default page