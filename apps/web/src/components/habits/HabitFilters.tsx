'use client';

import { useState } from 'react';

export type HabitFilter = {
  status: 'all' | 'active' | 'inactive';
  sortBy: 'name' | 'createdAt' | 'streak' | 'lastCompleted';
  sortOrder: 'asc' | 'desc';
  searchTerm: string;
};

interface HabitFiltersProps {
  filters: HabitFilter;
  onFiltersChange: (filters: HabitFilter) => void;
  habitCount: number;
}

export function HabitFilters({ filters, onFiltersChange, habitCount }: HabitFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleStatusChange = (status: HabitFilter['status']) => {
    onFiltersChange({ ...filters, status });
  };

  const handleSortChange = (sortBy: HabitFilter['sortBy']) => {
    if (filters.sortBy === sortBy) {
      // Toggle sort order if same field
      onFiltersChange({ 
        ...filters, 
        sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
      });
    } else {
      // New sort field, default to ascending
      onFiltersChange({ ...filters, sortBy, sortOrder: 'asc' });
    }
  };

  const handleSearchChange = (searchTerm: string) => {
    onFiltersChange({ ...filters, searchTerm });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          Filters {habitCount > 0 && (
            <span className="ml-2 text-gray-500">({habitCount} habits)</span>
          )}
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:text-blue-700"
          aria-expanded={isExpanded}
        >
          {isExpanded ? 'Hide' : 'Show'} filters
        </button>
      </div>

      {isExpanded && (
        <>
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search habits
            </label>
            <input
              type="text"
              id="search"
              value={filters.searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">Status</span>
            <div className="flex gap-2">
              <StatusButton
                active={filters.status === 'all'}
                onClick={() => handleStatusChange('all')}
              >
                All
              </StatusButton>
              <StatusButton
                active={filters.status === 'active'}
                onClick={() => handleStatusChange('active')}
              >
                Active
              </StatusButton>
              <StatusButton
                active={filters.status === 'inactive'}
                onClick={() => handleStatusChange('inactive')}
              >
                Inactive
              </StatusButton>
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">Sort by</span>
            <div className="grid grid-cols-2 gap-2">
              <SortButton
                active={filters.sortBy === 'name'}
                onClick={() => handleSortChange('name')}
                sortOrder={filters.sortBy === 'name' ? filters.sortOrder : undefined}
              >
                Name
              </SortButton>
              <SortButton
                active={filters.sortBy === 'createdAt'}
                onClick={() => handleSortChange('createdAt')}
                sortOrder={filters.sortBy === 'createdAt' ? filters.sortOrder : undefined}
              >
                Created
              </SortButton>
              <SortButton
                active={filters.sortBy === 'streak'}
                onClick={() => handleSortChange('streak')}
                sortOrder={filters.sortBy === 'streak' ? filters.sortOrder : undefined}
              >
                Streak
              </SortButton>
              <SortButton
                active={filters.sortBy === 'lastCompleted'}
                onClick={() => handleSortChange('lastCompleted')}
                sortOrder={filters.sortBy === 'lastCompleted' ? filters.sortOrder : undefined}
              >
                Last Completed
              </SortButton>
            </div>
          </div>

          {/* Clear Filters */}
          {(filters.status !== 'all' || filters.searchTerm || filters.sortBy !== 'createdAt') && (
            <button
              onClick={() => onFiltersChange({
                status: 'all',
                sortBy: 'createdAt',
                sortOrder: 'desc',
                searchTerm: '',
              })}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear all filters
            </button>
          )}
        </>
      )}
    </div>
  );
}

function StatusButton({ active, onClick, children }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-sm rounded-md transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

function SortButton({ active, onClick, children, sortOrder }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  sortOrder?: 'asc' | 'desc';
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between ${
        active
          ? 'bg-blue-100 text-blue-700 border border-blue-300'
          : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
      }`}
    >
      <span>{children}</span>
      {active && sortOrder && (
        <svg
          className={`w-4 h-4 ml-1 transition-transform ${
            sortOrder === 'desc' ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 15l7-7 7 7"
          />
        </svg>
      )}
    </button>
  );
}