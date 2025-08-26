import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HabitForm } from './HabitForm';

describe('HabitForm', () => {
  it('renders form fields correctly', () => {
    const onSubmit = vi.fn();
    render(<HabitForm onSubmit={onSubmit} />);

    expect(screen.getByLabelText(/habit name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create habit/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty name', async () => {
    const onSubmit = vi.fn();
    render(<HabitForm onSubmit={onSubmit} />);

    const submitButton = screen.getByRole('button', { name: /create habit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error for long name', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<HabitForm onSubmit={onSubmit} />);

    const nameInput = screen.getByLabelText(/habit name/i);
    await user.type(nameInput, 'a'.repeat(101));

    const submitButton = screen.getByRole('button', { name: /create habit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name must be less than 100 characters/i)).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<HabitForm onSubmit={onSubmit} />);

    const nameInput = screen.getByLabelText(/habit name/i);
    const descriptionInput = screen.getByLabelText(/description/i);

    await user.type(nameInput, 'Morning Meditation');
    await user.type(descriptionInput, 'Daily 10-minute meditation practice');

    const submitButton = screen.getByRole('button', { name: /create habit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Morning Meditation',
        description: 'Daily 10-minute meditation practice',
      });
    });
  });

  it('resets form after successful submission', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<HabitForm onSubmit={onSubmit} />);

    const nameInput = screen.getByLabelText(/habit name/i) as HTMLInputElement;
    await user.type(nameInput, 'Test Habit');

    const submitButton = screen.getByRole('button', { name: /create habit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(nameInput.value).toBe('');
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    render(<HabitForm onSubmit={onSubmit} onCancel={onCancel} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('disables form fields when submitting', () => {
    const onSubmit = vi.fn();
    render(<HabitForm onSubmit={onSubmit} isSubmitting={true} />);

    expect(screen.getByLabelText(/habit name/i)).toBeDisabled();
    expect(screen.getByLabelText(/description/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
  });
});