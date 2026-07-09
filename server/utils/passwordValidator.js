function validatePassword(password) {
  if (!password || password.length < 8) {
    return { isValid: false, message: 'Le mot de passe doit contenir au moins 8 caractères.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Le mot de passe doit contenir au moins une lettre majuscule (A-Z).' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Le mot de passe doit contenir au moins une lettre minuscule (a-z).' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Le mot de passe doit contenir au moins un chiffre (0-9).' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>\-_]/.test(password)) {
    return { isValid: false, message: 'Le mot de passe doit contenir au moins un caractère spécial (ex: @, $, !, %, *, ?, &, etc.).' };
  }
  return { isValid: true };
}

module.exports = { validatePassword };
