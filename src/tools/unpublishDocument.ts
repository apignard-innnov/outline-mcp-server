import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { getOutlineClient } from '../outline/outlineClient.js';
import toolRegistry from '../utils/toolRegistry.js';
import z from 'zod';

// Register this tool
toolRegistry.register('unpublish_document', {
  name: 'unpublish_document',
  description: 'Move a published document back to draft status',
  inputSchema: {
    id: z.string().describe('ID of the document to unpublish'),
  },
  async callback(args) {
    try {
      const client = getOutlineClient();
      const response = await client.post('/documents.unpublish', {
        id: args.id,
      });
      return { content: [{ type: 'text', text: JSON.stringify(response.data.data) }] };
    } catch (error: any) {
      console.error('Error unpublishing document:', error.message);
      throw new McpError(ErrorCode.InvalidRequest, error.message);
    }
  },
});
