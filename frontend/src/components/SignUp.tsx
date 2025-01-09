import { useSignUp, SignUp as ClerkSignUp } from '@clerk/clerk-react';
import { userService } from '../services/userService';
import { useEffect } from 'react';

export function SignUp() {
  const { signUp, setActive } = useSignUp();

  useEffect(() => {
    if (!signUp) return;

    const handleComplete = async () => {
      if (signUp.status === 'complete') {
        try {
          // Only sync in development after successful signup
          if (import.meta.env.DEV) {
            if (signUp.createdUserId) {
              await userService.handleNewUserSignup(signUp.createdUserId);
            }
          }
          // Set the user as active in Clerk
          await setActive({ session: signUp.createdSessionId });
        } catch (error) {
          console.error('Error handling signup completion:', error);
        }
      }
    };

    handleComplete();
  }, [signUp?.status, signUp?.createdUserId, signUp?.createdSessionId, setActive]);

  return (
    <ClerkSignUp 
      routing="path"
      path="/sign-up"
      redirectUrl="/"
      signInUrl="/sign-in"
      appearance={{
        elements: {
          rootBox: {
            width: '100%'
          }
        }
      }}
    />
  );
} 