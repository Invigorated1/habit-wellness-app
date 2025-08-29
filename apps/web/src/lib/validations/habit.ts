/**
 * Validation schemas for habit-related operations
 * Using manual validation for now, but consider adding Zod for more robust validation
 */

export interface CreateHabitInput {
  name: string;
  description?: string | null;
}

export interface UpdateHabitInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
  streak?: number;
}

export function validateCreateHabit(data: any): { 
  isValid: boolean; 
  errors: string[]; 
  data?: CreateHabitInput;
} {
  const errors: string[] = [];

  // Validate name
  if (data.name === undefined || data.name === null) {
    errors.push('Name is required');
  } else if (typeof data.name !== 'string') {
    errors.push('Name must be a string');
  } else if (data.name.trim().length === 0) {
    errors.push('Name cannot be empty');
  } else if (data.name.trim().length > 100) {
    errors.push('Name must be less than 100 characters');
  }

  // Validate description
  if (data.description !== undefined && data.description !== null) {
    if (typeof data.description !== 'string') {
      errors.push('Description must be a string');
    } else if (data.description.length > 500) {
      errors.push('Description must be less than 500 characters');
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    data: {
      name: data.name.trim(),
      description: data.description?.trim() || null,
    },
  };
}

export function validateUpdateHabit(data: any): {
  isValid: boolean;
  errors: string[];
  data?: UpdateHabitInput;
} {
  const errors: string[] = [];
  const updates: UpdateHabitInput = {};

  // Validate name if provided
  if ('name' in data) {
    if (!data.name || typeof data.name !== 'string') {
      errors.push('Name must be a non-empty string');
    } else if (data.name.trim().length === 0) {
      errors.push('Name cannot be empty');
    } else if (data.name.length > 100) {
      errors.push('Name must be less than 100 characters');
    } else {
      updates.name = data.name.trim();
    }
  }

  // Validate description if provided
  if ('description' in data) {
    if (data.description !== null && typeof data.description !== 'string') {
      errors.push('Description must be a string or null');
    } else if (data.description && data.description.length > 500) {
      errors.push('Description must be less than 500 characters');
    } else {
      updates.description = data.description?.trim() || null;
    }
  }

  // Validate isActive if provided
  if ('isActive' in data) {
    if (typeof data.isActive !== 'boolean') {
      errors.push('isActive must be a boolean');
    } else {
      updates.isActive = data.isActive;
    }
  }

  // Validate streak if provided
  if ('streak' in data) {
    if (typeof data.streak !== 'number' || !Number.isInteger(data.streak)) {
      errors.push('Streak must be an integer');
    } else if (data.streak < 0) {
      errors.push('Streak must be non-negative');
    } else {
      updates.streak = data.streak;
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    data: updates,
  };
}