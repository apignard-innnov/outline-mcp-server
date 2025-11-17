import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { getOutlineClient } from '../outline/outlineClient.js';
import toolRegistry from '../utils/toolRegistry.js';
import z from 'zod';

// Register this tool
toolRegistry.register('delete_share', {
  name: 'delete_share',
  description: 'Revoke a public share link',
  inputSchema: {
    id: z.string().describe('ID of the share to revoke'),
  },
  async callback(args) {
    try {
      const client = getOutlineClient();
      const response = await client.post('/shares.delete', {
        id: args.id,
      });
      return { content: [{ type: 'text', text: JSON.stringify(response.data.success) }] };
    } catch (error: any) {
      console.error('Error deleting share:', error.message);
      throw new McpError(ErrorCode.InvalidRequest, error.message);
    }
  },
});
