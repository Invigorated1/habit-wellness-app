'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface SLI {
  name: string;
  value: number;
  target: number;
  unit: string;
  period: string;
  compliant: boolean;
  compliancePercentage: number;
}

export default function MonitoringDashboard() {
  const { data, error, isLoading } = useSWR('/api/monitoring/sli', fetcher, {
    refreshInterval: 5000, // Refresh every 5 seconds
  });

  if (error) return <div className="p-4 text-red-500">Failed to load monitoring data</div>;
  if (isLoading) return <div className="p-4">Loading monitoring data...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">System Monitoring Dashboard</h1>
      
      {/* SLI/SLO Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {data?.data?.slis?.map((sli: SLI) => (
          <div
            key={sli.name}
            className={`p-4 border rounded-lg ${
              sli.compliant ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
            }`}
          >
            <h3 className="font-semibold text-lg">{sli.name}</h3>
            <div className="mt-2">
              <span className="text-2xl font-bold">
                {sli.value.toFixed(2)}{sli.unit}
              </span>
              <span className="text-gray-600 ml-2">
                / {sli.target}{sli.unit}
              </span>
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    sli.compliant ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(sli.compliancePercentage, 100)}%` }}
                />
              </div>
              <span className="text-sm text-gray-600">
                {sli.compliancePercentage.toFixed(1)}% of target
              </span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Period: {sli.period}
            </div>
          </div>
        ))}
      </div>

      {/* Performance Stats */}
      {data?.data?.performance && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Performance Metrics</h2>
          <div className="bg-gray-100 p-4 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Uptime</div>
                <div className="font-semibold">{data.data.performance.uptime.formatted}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Heap Used</div>
                <div className="font-semibold">{data.data.performance.memory.heapUsed}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">RSS</div>
                <div className="font-semibold">{data.data.performance.memory.rss}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Requests</div>
                <div className="font-semibold">
                  {data.data.performance.metrics?.totalRequests || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Route Performance */}
      {data?.data?.performance?.metrics?.routes && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Route Performance</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Route</th>
                  <th className="px-4 py-2 text-right">Count</th>
                  <th className="px-4 py-2 text-right">Avg (ms)</th>
                  <th className="px-4 py-2 text-right">P95 (ms)</th>
                  <th className="px-4 py-2 text-right">P99 (ms)</th>
                </tr>
              </thead>
              <tbody>
                {data.data.performance.metrics.routes.map((route: any) => (
                  <tr key={route.route} className="border-t">
                    <td className="px-4 py-2">{route.route}</td>
                    <td className="px-4 py-2 text-right">{route.count}</td>
                    <td className="px-4 py-2 text-right">{route.avg}</td>
                    <td className="px-4 py-2 text-right">{route.p95}</td>
                    <td className="px-4 py-2 text-right">{route.p99}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="mt-8 text-sm text-gray-500">
        Last updated: {new Date(data?.data?.timestamp).toLocaleString()}
      </div>
    </div>
  );
}