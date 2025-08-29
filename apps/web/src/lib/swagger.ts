export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Habit Wellness API',
    version: '1.0.0',
    description: 'API for managing personal habits and tracking daily progress',
  },
  servers: [
    {
      url: process.env.NODE_ENV === 'production' 
        ? 'https://your-domain.com' 
        : 'http://localhost:3000',
      description: process.env.NODE_ENV === 'production' 
        ? 'Production server' 
        : 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      ClerkAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'Authentication via Clerk session',
      },
    },
    schemas: {
      Habit: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier',
            example: 'clxxx123',
          },
          name: {
            type: 'string',
            description: 'Name of the habit',
            example: 'Exercise',
          },
          description: {
            type: 'string',
            nullable: true,
            description: 'Optional description',
            example: 'Daily workout routine',
          },
          streak: {
            type: 'integer',
            description: 'Current streak in days',
            example: 5,
          },
          isActive: {
            type: 'boolean',
            description: 'Whether the habit is active',
            example: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00.000Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00.000Z',
          },
        },
      },
      CreateHabitInput: {
        type: 'object',
        required: ['name'],
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            example: 'Reading',
          },
          description: {
            type: 'string',
            nullable: true,
            maxLength: 500,
            example: 'Read for 30 minutes daily',
          },
        },
      },
      UpdateHabitInput: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
          },
          description: {
            type: 'string',
            nullable: true,
            maxLength: 500,
          },
          isActive: {
            type: 'boolean',
          },
          streak: {
            type: 'integer',
            minimum: 0,
          },
        },
      },
      HabitEntry: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
          },
          date: {
            type: 'string',
            format: 'date-time',
          },
          completed: {
            type: 'boolean',
          },
          notes: {
            type: 'string',
            nullable: true,
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message',
          },
          statusCode: {
            type: 'integer',
            description: 'HTTP status code',
          },
          errors: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Validation errors (if applicable)',
          },
        },
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
            description: 'Response data',
          },
        },
      },
    },
  },
  paths: {
    '/api/habits': {
      get: {
        tags: ['Habits'],
        summary: 'List all habits',
        description: 'Returns all habits for the authenticated user',
        security: [{ ClerkAuth: [] }],
        responses: {
          200: {
            description: 'List of habits',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Habit' },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          429: {
            description: 'Rate limit exceeded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Habits'],
        summary: 'Create a new habit',
        security: [{ ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateHabitInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Habit created',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/Habit' },
                      },
                    },
                  ],
                },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/habits/{id}': {
      get: {
        tags: ['Habits'],
        summary: 'Get a single habit',
        description: 'Returns a habit with its recent entries',
        security: [{ ClerkAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
            description: 'Habit ID',
          },
        ],
        responses: {
          200: {
            description: 'Habit details',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          allOf: [
                            { $ref: '#/components/schemas/Habit' },
                            {
                              type: 'object',
                              properties: {
                                entries: {
                                  type: 'array',
                                  items: { $ref: '#/components/schemas/HabitEntry' },
                                },
                              },
                            },
                          ],
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          404: {
            description: 'Habit not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      patch: {
        tags: ['Habits'],
        summary: 'Update a habit',
        security: [{ ClerkAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateHabitInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Habit updated',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/Habit' },
                      },
                    },
                  ],
                },
              },
            },
          },
          400: {
            description: 'Validation error',
          },
          404: {
            description: 'Habit not found',
          },
        },
      },
      delete: {
        tags: ['Habits'],
        summary: 'Delete a habit',
        description: 'Deletes a habit and all its entries',
        security: [{ ClerkAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          200: {
            description: 'Habit deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                      example: true,
                    },
                    data: {
                      type: 'object',
                      properties: {
                        message: {
                          type: 'string',
                          example: 'Habit deleted successfully',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          404: {
            description: 'Habit not found',
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Habits',
      description: 'Operations related to habit management',
    },
  ],
};