import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { getOutlineClient } from '../outline/outlineClient.js';
import toolRegistry from '../utils/toolRegistry.js';
import z from 'zod';

// Register this tool
toolRegistry.register('list_stars', {
  name: 'list_stars',
  description: 'List starred documents and collections',
  inputSchema: {
    userId: z.string().describe('Filter by user ID (optional)').optional(),
    limit: z.number().describe('Maximum number of stars to return (optional)').optional(),
    offset: z.number().describe('Pagination offset (optional)').optional(),
  },
  async callback(args) {
    try {
      const payload: Record<string, any> = {};

      if (args.userId) {
        payload.userId = args.userId;
      }

      if (args.limit !== undefined) {
        payload.limit = args.limit;
      }

      if (args.offset !== undefined) {
        payload.offset = args.offset;
      }

      const client = getOutlineClient();
      const response = await client.post('/stars.list', payload);
      return {
        content: [
          { type: 'text', text: `stars: ${JSON.stringify(response.data.data)}` },
          { type: 'text', text: `pagination: ${JSON.stringify(response.data.pagination)}` },
        ],
      };
    } catch (error: any) {
      console.error('Error listing stars:', error.message);
      throw new McpError(ErrorCode.InvalidRequest, error.message);
    }
  },
});
