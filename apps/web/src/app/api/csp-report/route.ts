import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Handles Content Security Policy violation reports
 * This endpoint receives reports when CSP blocks something
 */
export async function POST(request: NextRequest) {
  try {
    const report = await request.json();
    
    // Log CSP violations for monitoring
    logger.warn('CSP Violation', {
      blockedUri: report['csp-report']?.['blocked-uri'],
      documentUri: report['csp-report']?.['document-uri'],
      violatedDirective: report['csp-report']?.['violated-directive'],
      effectiveDirective: report['csp-report']?.['effective-directive'],
      originalPolicy: report['csp-report']?.['original-policy'],
      sourceFile: report['csp-report']?.['source-file'],
      lineNumber: report['csp-report']?.['line-number'],
      columnNumber: report['csp-report']?.['column-number'],
    });

    // In production, you might want to send these to a monitoring service
    // like Sentry or store them for analysis
    
    return NextResponse.json({ status: 'reported' }, { status: 204 });
  } catch (error) {
    logger.error('Failed to process CSP report', { error });
    return NextResponse.json({ error: 'Invalid report' }, { status: 400 });
  }
}