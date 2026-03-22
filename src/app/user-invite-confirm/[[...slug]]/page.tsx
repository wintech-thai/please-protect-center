import React from 'react'
import { NavbarClean } from '@/src/components/layout/navbar-clean'
import { UserInviteConfirmView } from '@/src/modules/auth/views/user-invite-confirm-view'

const page = () => {
  return (
    <div>
        <NavbarClean />
        <UserInviteConfirmView />
    </div>
  )
}

export default page