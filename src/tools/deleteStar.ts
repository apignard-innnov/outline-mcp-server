import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { getOutlineClient } from '../outline/outlineClient.js';
import toolRegistry from '../utils/toolRegistry.js';
import z from 'zod';

// Register this tool
toolRegistry.register('delete_star', {
  name: 'delete_star',
  description: 'Unstar a document or collection (remove from favorites)',
  inputSchema: {
    id: z.string().describe('ID of the document or collection to unstar'),
  },
  async callback(args) {
    try {
      const client = getOutlineClient();
      const response = await client.post('/stars.delete', {
        id: args.id,
      });
      return { content: [{ type: 'text', text: JSON.stringify(response.data.success) }] };
    } catch (error: any) {
      console.error('Error deleting star:', error.message);
      throw new McpError(ErrorCode.InvalidRequest, error.message);
    }
  },
});
