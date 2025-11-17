import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { getOutlineClient } from '../outline/outlineClient.js';
import toolRegistry from '../utils/toolRegistry.js';
import z from 'zod';

// Register this tool
toolRegistry.register('get_revision', {
  name: 'get_revision',
  description: 'Get details about a specific document revision',
  inputSchema: {
    id: z.string().describe('ID of the revision to retrieve'),
  },
  async callback(args) {
    try {
      const client = getOutlineClient();
      const response = await client.post('/revisions.info', { id: args.id });
      return { content: [{ type: 'text', text: JSON.stringify(response.data.data) }] };
    } catch (error: any) {
      console.error('Error getting revision:', error.message);
      throw new McpError(ErrorCode.InvalidRequest, error.message);
    }
  },
});
