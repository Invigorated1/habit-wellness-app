import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { trackServerEvent } from '@/lib/posthog';
import * as Sentry from '@sentry/nextjs';

/**
 * Handles Content Security Policy violation reports
 * This endpoint receives reports when CSP blocks something
 */
export async function POST(request: NextRequest) {
  try {
    const report = await request.json();
    const cspReport = report['csp-report'];
    
    if (!cspReport) {
      return NextResponse.json({ error: 'Invalid report format' }, { status: 400 });
    }

    // Extract violation details
    const violation = {
      blockedUri: cspReport['blocked-uri'],
      documentUri: cspReport['document-uri'],
      violatedDirective: cspReport['violated-directive'],
      effectiveDirective: cspReport['effective-directive'],
      originalPolicy: cspReport['original-policy'],
      sourceFile: cspReport['source-file'],
      lineNumber: cspReport['line-number'],
      columnNumber: cspReport['column-number'],
      referrer: cspReport['referrer'],
      statusCode: cspReport['status-code'],
    };

    // Log CSP violations for monitoring
    logger.warn('CSP Violation', violation);

    // Send to Sentry for tracking
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureMessage('CSP Violation', {
        level: 'warning',
        tags: {
          category: 'security',
          directive: violation.violatedDirective,
        },
        extra: violation,
      });
    }

    // Track in PostHog for analytics
    if (violation.sourceFile && !violation.sourceFile.includes('extension://')) {
      // Don't track browser extension violations
      trackServerEvent('system', 'csp_violation', {
        directive: violation.violatedDirective,
        blockedUri: violation.blockedUri,
        sourceFile: violation.sourceFile,
      });
    }

    // Optional: Forward to external CSP monitoring service
    if (process.env.CSP_EXTERNAL_REPORT_URI) {
      try {
        await fetch(process.env.CSP_EXTERNAL_REPORT_URI, {
          method: 'POST',
          headers: { 'Content-Type': 'application/csp-report' },
          body: JSON.stringify(report),
        });
      } catch (error) {
        logger.error('Failed to forward CSP report', { error });
      }
    }
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error('Failed to process CSP report', { error });
    return NextResponse.json({ error: 'Invalid report' }, { status: 400 });
  }
}

// CSP reports can be large, increase the body size limit
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10kb',
    },
  },
};