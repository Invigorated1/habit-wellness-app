import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HabitCard } from './HabitCard';
import { Habit } from '@/lib/api/habits';

const mockHabit: Habit = {
  id: '1',
  name: 'Test Habit',
  description: 'Test description',
  streak: 5,
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  userId: 'user123',
};

describe('HabitCard', () => {
  it('renders habit information correctly', () => {
    const onUpdate = vi.fn();
    const onDelete = vi.fn();
    
    render(<HabitCard habit={mockHabit} onUpdate={onUpdate} onDelete={onDelete} />);

    expect(screen.getByText('Test Habit')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('Streak: 5 days')).toBeInTheDocument();
    expect(screen.getByText(/Created: 1\/1\/2024/)).toBeInTheDocument();
  });

  it('shows inactive status for inactive habits', () => {
    const onUpdate = vi.fn();
    const onDelete = vi.fn();
    const inactiveHabit = { ...mockHabit, isActive: false };
    
    render(<HabitCard habit={inactiveHabit} onUpdate={onUpdate} onDelete={onDelete} />);

    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('switches to edit mode when edit button is clicked', () => {
    const onUpdate = vi.fn();
    const onDelete = vi.fn();
    
    render(<HabitCard habit={mockHabit} onUpdate={onUpdate} onDelete={onDelete} />);

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    expect(screen.getByText('Edit Habit')).toBeInTheDocument();
    expect(screen.queryByText('Test Habit')).not.toBeInTheDocument();
  });

  it('calls onDelete with confirmation', async () => {
    const onUpdate = vi.fn();
    const onDelete = vi.fn().mockResolvedValue(undefined);
    
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    
    render(<HabitCard habit={mockHabit} onUpdate={onUpdate} onDelete={onDelete} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete "Test Habit"?');
    
    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith('1');
    });

    confirmSpy.mockRestore();
  });

  it('does not delete when confirmation is cancelled', () => {
    const onUpdate = vi.fn();
    const onDelete = vi.fn();
    
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    
    render(<HabitCard habit={mockHabit} onUpdate={onUpdate} onDelete={onDelete} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('shows loading state while deleting', async () => {
    const onUpdate = vi.fn();
    const onDelete = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    
    render(<HabitCard habit={mockHabit} onUpdate={onUpdate} onDelete={onDelete} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(screen.getByText('Deleting...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /deleting/i })).toBeDisabled();
  });
});