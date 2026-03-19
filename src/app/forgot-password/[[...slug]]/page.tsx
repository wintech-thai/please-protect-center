import React from 'react'
import { NavbarClean } from '@/src/components/layout/navbar-clean'
import ForgotPasswordForm from '@/src/modules/auth/views/forgot-password.view'
const page = () => {
  return (
    <div>
        <NavbarClean />
        <ForgotPasswordForm />
    </div>
  )
}

export default page