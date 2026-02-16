"use client"
import React from 'react'
import { signIn } from 'next-auth/react'
import LoginPage from '@/components/login-page/login'


export default function Loginpage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
           <LoginPage />
        </div>
    )
}