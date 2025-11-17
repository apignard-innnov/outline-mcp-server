import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { getOutlineClient } from '../outline/outlineClient.js';
import toolRegistry from '../utils/toolRegistry.js';
import z from 'zod';

// Register this tool
toolRegistry.register('delete_collection', {
  name: 'delete_collection',
  description: 'Delete a collection and all its documents',
  inputSchema: {
    id: z.string().describe('ID of the collection to delete'),
  },
  async callback(args) {
    try {
      const client = getOutlineClient();
      const response = await client.post('/collections.delete', {
        id: args.id,
      });
      return { content: [{ type: 'text', text: JSON.stringify(response.data.success) }] };
    } catch (error: any) {
      console.error('Error deleting collection:', error.message);
      throw new McpError(ErrorCode.InvalidRequest, error.message);
    }
  },
});
