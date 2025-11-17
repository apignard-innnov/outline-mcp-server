import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { getOutlineClient } from '../outline/outlineClient.js';
import toolRegistry from '../utils/toolRegistry.js';
import z from 'zod';

// Register this tool
toolRegistry.register('create_star', {
  name: 'create_star',
  description: 'Star a document or collection (mark as favorite)',
  inputSchema: {
    id: z.string().describe('ID of the document or collection to star'),
  },
  async callback(args) {
    try {
      const client = getOutlineClient();
      const response = await client.post('/stars.create', {
        id: args.id,
      });
      return { content: [{ type: 'text', text: JSON.stringify(response.data.data) }] };
    } catch (error: any) {
      console.error('Error creating star:', error.message);
      throw new McpError(ErrorCode.InvalidRequest, error.message);
    }
  },
});
