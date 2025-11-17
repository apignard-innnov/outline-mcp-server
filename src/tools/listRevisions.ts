import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { getOutlineClient } from '../outline/outlineClient.js';
import toolRegistry from '../utils/toolRegistry.js';
import z from 'zod';

// Register this tool
toolRegistry.register('list_revisions', {
  name: 'list_revisions',
  description: 'List revision history for a document',
  inputSchema: {
    documentId: z.string().describe('ID of the document'),
    limit: z.number().describe('Maximum number of revisions to return (optional)').optional(),
    offset: z.number().describe('Pagination offset (optional)').optional(),
  },
  async callback(args) {
    try {
      const payload: Record<string, any> = {
        documentId: args.documentId,
      };

      if (args.limit !== undefined) {
        payload.limit = args.limit;
      }

      if (args.offset !== undefined) {
        payload.offset = args.offset;
      }

      const client = getOutlineClient();
      const response = await client.post('/revisions.list', payload);
      return {
        content: [
          { type: 'text', text: `revisions: ${JSON.stringify(response.data.data)}` },
          { type: 'text', text: `pagination: ${JSON.stringify(response.data.pagination)}` },
        ],
      };
    } catch (error: any) {
      console.error('Error listing revisions:', error.message);
      throw new McpError(ErrorCode.InvalidRequest, error.message);
    }
  },
});
