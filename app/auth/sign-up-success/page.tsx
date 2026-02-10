'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

export default function SignUpSuccess() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Account Created</CardTitle>
              <CardDescription>
                Your account has been created successfully
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
                  <p className="font-medium mb-2">Verify your email</p>
                  <p>
                    We've sent a verification link to your email address. Please check your inbox and click the link to confirm your account.
                  </p>
                </div>
                
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-gray-600">
                    Once verified, you can sign in to access your dashboard.
                  </p>
                  
                  <Link href="/auth/login" className="w-full">
                    <Button className="w-full">
                      Back to Login
                    </Button>
                  </Link>

                  <Link href="/" className="w-full">
                    <Button variant="outline" className="w-full bg-transparent">
                      Return Home
                    </Button>
                  </Link>
                </div>

                <div className="text-center text-xs text-gray-500 pt-4 border-t">
                  <p>Didn't receive the email? Check your spam folder or contact support.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
