import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { getOutlineClient } from '../outline/outlineClient.js';
import toolRegistry from '../utils/toolRegistry.js';
import z from 'zod';

// Register this tool
toolRegistry.register('get_share', {
  name: 'get_share',
  description: 'Get details about a specific share',
  inputSchema: {
    id: z.string().describe('ID or shareId of the share to retrieve'),
  },
  async callback(args) {
    try {
      const client = getOutlineClient();
      const response = await client.post('/shares.info', { id: args.id });
      return { content: [{ type: 'text', text: JSON.stringify(response.data.data) }] };
    } catch (error: any) {
      console.error('Error getting share:', error.message);
      throw new McpError(ErrorCode.InvalidRequest, error.message);
    }
  },
});
