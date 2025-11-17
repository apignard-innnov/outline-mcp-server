import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { getOutlineClient } from '../outline/outlineClient.js';
import toolRegistry from '../utils/toolRegistry.js';
import z from 'zod';

// Register this tool
toolRegistry.register('export_collection', {
  name: 'export_collection',
  description: 'Export a collection in the specified format',
  inputSchema: {
    id: z.string().describe('ID of the collection to export'),
    format: z
      .enum(['outline-markdown', 'json', 'html'])
      .describe('Export format (optional, defaults to outline-markdown)')
      .optional(),
  },
  async callback(args) {
    try {
      const payload: Record<string, any> = {
        id: args.id,
      };

      if (args.format) {
        payload.format = args.format;
      }

      const client = getOutlineClient();
      const response = await client.post('/collections.export', payload);
      return { content: [{ type: 'text', text: JSON.stringify(response.data.data) }] };
    } catch (error: any) {
      console.error('Error exporting collection:', error.message);
      throw new McpError(ErrorCode.InvalidRequest, error.message);
    }
  },
});
