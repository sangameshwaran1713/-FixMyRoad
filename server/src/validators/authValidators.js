/**
 * Validate registration input payload
 */
export const validateRegisterInput = ({ name, email, password, confirmPassword }) => {
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!email || typeof email !== 'string' || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email.trim())) {
    errors.push('A valid email address is required');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    errors.push('Passwords do not match');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate login input payload
 */
export const validateLoginInput = ({ identifier, email, username, password }) => {
  const errors = [];
  const key = identifier || email || username;

  if (!key || typeof key !== 'string' || key.trim().length === 0) {
    errors.push('Username or Email is required');
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('Password is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
