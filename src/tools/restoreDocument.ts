import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { getOutlineClient } from '../outline/outlineClient.js';
import toolRegistry from '../utils/toolRegistry.js';
import z from 'zod';

// Register this tool
toolRegistry.register('restore_document', {
  name: 'restore_document',
  description: 'Restore an archived or deleted document',
  inputSchema: {
    id: z.string().describe('ID of the document to restore'),
    revisionId: z.string().describe('Optional revision ID to restore to a specific version').optional(),
  },
  async callback(args) {
    try {
      const payload: Record<string, any> = {
        id: args.id,
      };

      if (args.revisionId) {
        payload.revisionId = args.revisionId;
      }

      const client = getOutlineClient();
      const response = await client.post('/documents.restore', payload);
      return { content: [{ type: 'text', text: JSON.stringify(response.data.data) }] };
    } catch (error: any) {
      console.error('Error restoring document:', error.message);
      throw new McpError(ErrorCode.InvalidRequest, error.message);
    }
  },
});
