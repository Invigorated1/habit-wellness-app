'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';
import { swaggerSpec } from '@/lib/swagger';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-4">API Documentation</h1>
        <p className="text-gray-600 mb-8">
          Interactive documentation for the Habit Wellness API. All endpoints require authentication.
        </p>
        <div className="border rounded-lg">
          <SwaggerUI 
            spec={swaggerSpec} 
            docExpansion="list"
            defaultModelsExpandDepth={1}
            persistAuthorization={true}
          />
        </div>
      </div>
    </div>
  );
}