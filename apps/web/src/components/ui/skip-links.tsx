'use client';

import React from 'react';

interface SkipLink {
  href: string;
  label: string;
}

const defaultLinks: SkipLink[] = [
  { href: '#main-content', label: 'Skip to main content' },
  { href: '#navigation', label: 'Skip to navigation' },
];

export function SkipLinks({ links = defaultLinks }: { links?: SkipLink[] }) {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <div className="absolute top-0 left-0 z-50 bg-white p-2">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="block px-4 py-2 text-blue-600 underline focus:bg-blue-100 focus:outline-none"
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}