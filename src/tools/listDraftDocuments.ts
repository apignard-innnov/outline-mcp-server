import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { getOutlineClient } from '../outline/outlineClient.js';
import toolRegistry from '../utils/toolRegistry.js';
import z from 'zod';

// Register this tool
toolRegistry.register('list_draft_documents', {
  name: 'list_draft_documents',
  description: 'List draft documents in the Outline workspace',
  inputSchema: {
    collectionId: z.string().describe('Filter by collection ID (optional)').optional(),
    dateFilter: z
      .enum(['day', 'week', 'month', 'year'])
      .describe('Filter documents updated within a time period (optional)')
      .optional(),
    limit: z.number().describe('Maximum number of documents to return (optional)').optional(),
    offset: z.number().describe('Pagination offset (optional)').optional(),
    sort: z.string().describe('Field to sort by (e.g. "updatedAt") (optional)').optional(),
  },
  async callback(args) {
    try {
      const payload: Record<string, any> = {};

      if (args.collectionId) {
        payload.collectionId = args.collectionId;
      }

      if (args.dateFilter) {
        payload.dateFilter = args.dateFilter;
      }

      if (args.limit !== undefined) {
        payload.limit = args.limit;
      }

      if (args.offset !== undefined) {
        payload.offset = args.offset;
      }

      if (args.sort) {
        payload.sort = args.sort;
      }

      const client = getOutlineClient();
      const response = await client.post('/documents.drafts', payload);
      return {
        content: [
          { type: 'text', text: `documents: ${JSON.stringify(response.data.data)}` },
          { type: 'text', text: `pagination: ${JSON.stringify(response.data.pagination)}` },
        ],
      };
    } catch (error: any) {
      console.error('Error listing draft documents:', error.message);
      throw new McpError(ErrorCode.InvalidRequest, error.message);
    }
  },
});
