/**
 * Form validation utilities using common patterns
 * These can be easily integrated with form libraries like zod
 */

/**
 * Validate required field
 */
export const required = (message = 'This field is required') => (value) => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return message;
  }
  return '';
};

/**
 * Validate email format
 */
export const email = (message = 'Please enter a valid email') => (value) => {
  if (!value) return '';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(value)) {
    return message;
  }
  return '';
};

/**
 * Validate minimum length
 */
export const minLength = (min, message = `Must be at least ${min} characters`) => (value) => {
  if (!value) return '';
  if (value.length < min) {
    return message;
  }
  return '';
};

/**
 * Validate maximum length
 */
export const maxLength = (max, message = `Must be no more than ${max} characters`) => (value) => {
  if (!value) return '';
  if (value.length > max) {
    return message;
  }
  return '';
};

/**
 * Validate password strength
 * Requires: uppercase, lowercase, number, special char, min 8 chars
 */
export const passwordStrength = (message = 'Password must contain uppercase, lowercase, number, and special character') => (value) => {
  if (!value) return '';
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!re.test(value)) {
    return message;
  }
  return '';
};

/**
 * Validate phone number
 */
export const phone = (message = 'Please enter a valid phone number') => (value) => {
  if (!value) return '';
  const re = /^[\d\s\-\+\(\)]+$/;
  if (!re.test(value) || value.replace(/\D/g, '').length < 10) {
    return message;
  }
  return '';
};

/**
 * Validate URL
 */
export const url = (message = 'Please enter a valid URL') => (value) => {
  if (!value) return '';
  try {
    new URL(value);
    return '';
  } catch {
    return message;
  }
};

/**
 * Validate number range
 */
export const range = (min, max, message = `Must be between ${min} and ${max}`) => (value) => {
  if (value === '' || value === null) return '';
  const num = Number(value);
  if (isNaN(num) || num < min || num > max) {
    return message;
  }
  return '';
};

/**
 * Validate file size
 * @param maxSizeMB - Maximum file size in MB
 */
export const fileSize = (maxSizeMB, message = `File must be smaller than ${maxSizeMB}MB`) => (file) => {
  if (!file) return '';
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return message;
  }
  return '';
};

/**
 * Validate file type
 */
export const fileType = (allowedTypes, message = `File type not allowed`) => (file) => {
  if (!file) return '';
  if (!allowedTypes.includes(file.type)) {
    return message;
  }
  return '';
};

/**
 * Match two fields (e.g., password confirmation)
 */
export const match = (fieldValue, message = 'Fields do not match') => (value) => {
  if (value !== fieldValue) {
    return message;
  }
  return '';
};

/**
 * Custom validation with predicate function
 */
export const custom = (predicate, message = 'Invalid value') => (value) => {
  if (!predicate(value)) {
    return message;
  }
  return '';
};

/**
 * Compose multiple validators
 */
export const compose = (...validators) => (value) => {
  for (const validator of validators) {
    const error = validator(value);
    if (error) return error;
  }
  return '';
};

/**
 * Common validation schemas
 */
export const ValidationSchemas = {
  /**
   * Login form validation
   */
  login: {
    email: compose(required('Email is required'), email()),
    password: compose(required('Password is required'), minLength(6, 'Password must be at least 6 characters')),
  },

  /**
   * Signup form validation
   */
  signup: {
    email: compose(required('Email is required'), email()),
    password: compose(
      required('Password is required'),
      passwordStrength()
    ),
    confirmPassword: compose(required('Please confirm password')),
    company: required('Company name is required'),
  },

  /**
   * Job creation form validation
   */
  jobCreation: {
    title: compose(required('Job title is required'), minLength(3)),
    role: required('Role is required'),
    department: required('Department is required'),
    location: required('Location is required'),
    description: compose(required('Description is required'), minLength(20)),
    salary_min: range(0, 1000000, 'Enter a valid minimum salary'),
    salary_max: range(0, 1000000, 'Enter a valid maximum salary'),
  },

  /**
   * Profile settings validation
   */
  settings: {
    name: compose(required('Name is required'), minLength(2)),
    email: compose(required('Email is required'), email()),
    phone: phone('Enter a valid phone number'),
    company: required('Company name is required'),
  },
};

/**
 * Async validator for checking if email already exists
 */
export const uniqueEmail = async (email) => {
  if (!email) return '';
  try {
    // This would call your API to check if email exists
    // const response = await api.checkEmail(email);
    // if (response.exists) {
    //   return 'Email already registered';
    // }
    return '';
  } catch (err) {
    return 'Could not validate email';
  }
};

/**
 * Validator factory for creating reusable validators
 */
export const createValidator = (rules) => {
  return (values) => {
    const errors = {};

    for (const [field, validators] of Object.entries(rules)) {
      const value = values[field];
      const validatorArray = Array.isArray(validators) ? validators : [validators];

      for (const validator of validatorArray) {
        const error = validator(value);
        if (error) {
          errors[field] = error;
          break;
        }
      }
    }

    return errors;
  };
};
