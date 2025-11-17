import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { getOutlineClient } from '../outline/outlineClient.js';
import toolRegistry from '../utils/toolRegistry.js';
import z from 'zod';

// Register this tool
toolRegistry.register('list_shares', {
  name: 'list_shares',
  description: 'List public document shares',
  inputSchema: {
    documentId: z.string().describe('Filter by document ID (optional)').optional(),
    userId: z.string().describe('Filter by user ID (optional)').optional(),
    includeExpired: z.boolean().describe('Include expired shares (optional)').optional(),
    limit: z.number().describe('Maximum number of shares to return (optional)').optional(),
    offset: z.number().describe('Pagination offset (optional)').optional(),
  },
  async callback(args) {
    try {
      const payload: Record<string, any> = {};

      if (args.documentId) {
        payload.documentId = args.documentId;
      }

      if (args.userId) {
        payload.userId = args.userId;
      }

      if (args.includeExpired !== undefined) {
        payload.includeExpired = args.includeExpired;
      }

      if (args.limit !== undefined) {
        payload.limit = args.limit;
      }

      if (args.offset !== undefined) {
        payload.offset = args.offset;
      }

      const client = getOutlineClient();
      const response = await client.post('/shares.list', payload);
      return {
        content: [
          { type: 'text', text: `shares: ${JSON.stringify(response.data.data)}` },
          { type: 'text', text: `pagination: ${JSON.stringify(response.data.pagination)}` },
        ],
      };
    } catch (error: any) {
      console.error('Error listing shares:', error.message);
      throw new McpError(ErrorCode.InvalidRequest, error.message);
    }
  },
});
