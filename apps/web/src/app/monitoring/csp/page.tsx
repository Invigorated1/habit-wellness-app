'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, TrendingUp } from 'lucide-react';

interface CSPViolation {
  id: string;
  timestamp: string;
  directive: string;
  blockedUri: string;
  documentUri: string;
  sourceFile?: string;
  lineNumber?: number;
  count: number;
}

export default function CSPMonitoringPage() {
  const [violations, setViolations] = useState<CSPViolation[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    // In a real implementation, this would fetch from your monitoring API
    // For now, we'll show sample data
    const sampleViolations: CSPViolation[] = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        directive: 'script-src',
        blockedUri: 'inline',
        documentUri: 'https://habitstory.app/dashboard',
        sourceFile: 'https://habitstory.app/dashboard',
        lineNumber: 42,
        count: 3,
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        directive: 'img-src',
        blockedUri: 'https://external-site.com/image.jpg',
        documentUri: 'https://habitstory.app/profile',
        count: 1,
      },
    ];

    setViolations(sampleViolations);
    setLoading(false);
  }, [timeRange]);

  const getDirectiveSeverity = (directive: string) => {
    if (directive.includes('script')) return 'high';
    if (directive.includes('object') || directive.includes('frame')) return 'medium';
    return 'low';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      default: return 'secondary';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">CSP Violation Monitoring</h1>
        <p className="text-muted-foreground">
          Monitor Content Security Policy violations to identify and fix security issues
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{violations.reduce((sum, v) => sum + v.count, 0)}</div>
            <p className="text-xs text-muted-foreground">Last {timeRange}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Violations</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{violations.length}</div>
            <p className="text-xs text-muted-foreground">Distinct issues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Common</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {violations.sort((a, b) => b.count - a.count)[0]?.directive || 'None'}
            </div>
            <p className="text-xs text-muted-foreground">Directive</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert for high severity violations */}
      {violations.some(v => getDirectiveSeverity(v.directive) === 'high') && (
        <Alert className="mb-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>High Severity Violations Detected</AlertTitle>
          <AlertDescription>
            Script-src violations detected. These could indicate XSS attempts or legitimate scripts being blocked.
            Review and update your CSP policy if needed.
          </AlertDescription>
        </Alert>
      )}

      {/* Violations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Violations</CardTitle>
          <CardDescription>
            Content Security Policy violations in the last {timeRange}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {violations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No CSP violations detected. Your security policy is working well!
              </p>
            ) : (
              violations.map((violation) => (
                <div key={violation.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{violation.directive}</span>
                        <Badge variant={getSeverityColor(getDirectiveSeverity(violation.directive))}>
                          {getDirectiveSeverity(violation.directive)}
                        </Badge>
                        <Badge variant="outline">{violation.count}x</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Blocked: {violation.blockedUri}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(violation.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="text-muted-foreground">Page:</span>{' '}
                      {violation.documentUri}
                    </p>
                    {violation.sourceFile && (
                      <p>
                        <span className="text-muted-foreground">Source:</span>{' '}
                        {violation.sourceFile}
                        {violation.lineNumber && `:${violation.lineNumber}`}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}