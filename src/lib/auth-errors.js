export function getSignInErrorMessage(error) {
  const code = error?.code?.toLowerCase() ?? ''
  const message = error?.message?.toLowerCase() ?? ''

  if (
    code === 'invalid_credentials' ||
    message.includes('invalid login credentials') ||
    message.includes('invalid email or password')
  ) {
    return 'Wrong email or password.'
  }

  if (message.includes('email not confirmed')) {
    return 'Confirm your email before signing in.'
  }

  return error?.message || 'Could not sign in. Try again.'
}

export function getSignUpErrorMessage(error) {
  const message = error?.message?.toLowerCase() ?? ''

  if (message.includes('password')) {
    return error.message
  }

  return error?.message || 'Could not create account. Try again.'
}
