'use client'
import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'
export default function SSOCallbackPage() {
  return (
    <AuthenticateWithRedirectCallback
      afterSignInUrl="/waitlist"
      afterSignUpUrl="/waitlist"
      signInForceRedirectUrl="/waitlist"
      signUpForceRedirectUrl="/waitlist"
      continueSignUpUrl="/sign-up/continue"
    />
  )
}
