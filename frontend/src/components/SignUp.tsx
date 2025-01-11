import { useSignUp, SignUp as ClerkSignUp } from '@clerk/clerk-react';
import { userService } from '../services/userService';
import { useEffect } from 'react';
import { logger } from '../utils/logger';

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
              const emailAddress = signUp.emailAddress;
              logger.debug('clerk', 'New user signup completed:', { userId: signUp.createdUserId, email: emailAddress });
              await userService.handleNewUserSignup(signUp.createdUserId, emailAddress);
            }
          }
          // Set the user as active in Clerk
          await setActive({ session: signUp.createdSessionId });
        } catch (error) {
          logger.error('clerk', 'Error handling signup completion:', error);
        }
      }
    };

    handleComplete();
  }, [signUp?.status, signUp?.createdUserId, signUp?.createdSessionId, signUp?.emailAddress, setActive]);

  return (
    <ClerkSignUp 
      routing="path"
      path="/sign-up"
      signInFallbackRedirectUrl="/"
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