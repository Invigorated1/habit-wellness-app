# Nonce-Based CSP Implementation Plan

## Overview

This document outlines the plan to implement nonce-based Content Security Policy (CSP) in our Next.js application to eliminate the need for `'unsafe-inline'` in production.

## Current State

- We currently use `'unsafe-inline'` for scripts and styles
- This is required for Next.js hydration and Tailwind CSS
- We remove `'unsafe-eval'` in production but keep `'unsafe-inline'`

## Target State

- Use cryptographic nonces for all inline scripts
- Maintain `'unsafe-inline'` as fallback for older browsers
- Achieve CSP Level 2 compliance

## Implementation Steps

### Phase 1: Infrastructure Setup (Week 1)

1. **Create Nonce Generator Middleware**
```typescript
// src/middleware/nonce.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

export function nonceMiddleware(request: NextRequest) {
  const nonce = generateNonce();
  const response = NextResponse.next();
  
  // Add nonce to headers for use in CSP
  response.headers.set('X-Nonce', nonce);
  
  return response;
}
```

2. **Update Security Middleware**
- Modify CSP generation to include nonce
- Add `'nonce-{value}'` to script-src and style-src

3. **Create Nonce Provider**
```typescript
// src/providers/NonceProvider.tsx
'use client';

import { createContext, useContext } from 'react';

const NonceContext = createContext<string>('');

export function NonceProvider({ 
  children, 
  nonce 
}: { 
  children: React.ReactNode;
  nonce: string;
}) {
  return (
    <NonceContext.Provider value={nonce}>
      {children}
    </NonceContext.Provider>
  );
}

export const useNonce = () => useContext(NonceContext);
```

### Phase 2: Next.js Integration (Week 2)

1. **Custom Document with Nonce**
```typescript
// src/app/layout.tsx modifications
import { headers } from 'next/headers';

export default function RootLayout({ children }) {
  const nonce = headers().get('X-Nonce') || '';
  
  return (
    <html>
      <head>
        {/* Next.js will automatically add nonce to its scripts */}
        <meta property="csp-nonce" content={nonce} />
      </head>
      <body>
        <NonceProvider nonce={nonce}>
          {children}
        </NonceProvider>
      </body>
    </html>
  );
}
```

2. **Configure Next.js for Nonce Support**
```typescript
// next.config.ts
const config = {
  experimental: {
    // Enable nonce support for scripts
    scriptLoader: {
      nonce: true,
    },
  },
  // Custom webpack config for CSS nonces
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins.push(
        new NonceWebpackPlugin({
          enabled: process.env.NODE_ENV === 'production',
        })
      );
    }
    return config;
  },
};
```

### Phase 3: Component Updates (Week 3)

1. **Update Script Components**
```typescript
// Before
<script dangerouslySetInnerHTML={{ __html: 'console.log("test")' }} />

// After
import { useNonce } from '@/providers/NonceProvider';

function MyComponent() {
  const nonce = useNonce();
  return (
    <script 
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: 'console.log("test")' }} 
    />
  );
}
```

2. **Handle Dynamic Scripts**
```typescript
// src/hooks/useScript.ts
export function useScript(src: string) {
  const nonce = useNonce();
  
  useEffect(() => {
    const script = document.createElement('script');
    script.src = src;
    script.nonce = nonce;
    script.async = true;
    
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, [src, nonce]);
}
```

### Phase 4: Style Handling (Week 4)

1. **CSS-in-JS Nonce Support**
```typescript
// For emotion/styled-components
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';

function MyApp({ Component, pageProps, nonce }) {
  const cache = createCache({
    key: 'css',
    nonce,
  });
  
  return (
    <CacheProvider value={cache}>
      <Component {...pageProps} />
    </CacheProvider>
  );
}
```

2. **Tailwind CSS Considerations**
- Tailwind generates utility classes at build time
- No inline styles, so nonce not needed for Tailwind
- Keep `'unsafe-inline'` for CSS for now

### Phase 5: Testing & Rollout (Week 5)

1. **CSP Report-Only Mode**
```typescript
// Start with report-only header
Content-Security-Policy-Report-Only: script-src 'self' 'nonce-{value}' 'unsafe-inline';
```

2. **Browser Compatibility Testing**
- Test with CSP Level 2 browsers
- Ensure fallback for older browsers
- Monitor CSP reports

3. **Gradual Rollout**
- 10% of production traffic
- Monitor for increased CSP violations
- Gradually increase to 100%

## Technical Considerations

### Pros
- Eliminates XSS risk from inline scripts
- Better security posture
- Industry best practice

### Cons
- Increased complexity
- Performance overhead (minimal)
- Requires careful testing

### Performance Impact
- Nonce generation: ~0.1ms per request
- Header size increase: ~50 bytes
- No client-side performance impact

## Monitoring Plan

1. **Metrics to Track**
   - CSP violation rate
   - Page load performance
   - JavaScript errors
   - Nonce generation time

2. **Alerts**
   - CSP violation spike (>10x normal)
   - Nonce generation failures
   - Performance degradation

## Rollback Plan

If issues arise:
1. Remove nonce from CSP header
2. Keep nonce generation (no impact)
3. Revert to `'unsafe-inline'` only
4. Investigate and fix issues
5. Re-attempt rollout

## Alternative Approaches

### 1. Hash-based CSP
- Generate hashes for all inline scripts
- More complex build process
- Less flexible than nonces

### 2. Move All Scripts External
- No inline scripts at all
- Requires significant refactoring
- May impact performance

### 3. Trusted Types API
- Future-looking approach
- Limited browser support
- Can be combined with nonces

## Recommended Approach

1. **Start with nonce-based CSP for scripts only**
2. **Keep `'unsafe-inline'` for styles initially**
3. **Use report-only mode for 2 weeks**
4. **Gradual production rollout**
5. **Consider style nonces in Phase 2**

## Success Criteria

- [ ] Zero increase in legitimate CSP violations
- [ ] No performance degradation (p95 < 5ms increase)
- [ ] Successfully blocks XSS attempts in testing
- [ ] Works across 95%+ of user browsers
- [ ] Passes security audit

## Timeline

- **Week 1-2**: Infrastructure setup
- **Week 3-4**: Implementation
- **Week 5**: Testing
- **Week 6-7**: Gradual rollout
- **Week 8**: Full production

## Resources Needed

- Engineering: 2 developers for 2 weeks
- Security review: 1 day
- Performance testing: 2 days
- Browser testing: 3 days

## Next Steps

1. Review and approve plan
2. Create feature branch
3. Implement Phase 1
4. Set up monitoring
5. Begin testing