import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { getOutlineClient } from '../outline/outlineClient.js';
import toolRegistry from '../utils/toolRegistry.js';
import z from 'zod';

// Register this tool
toolRegistry.register('export_document', {
  name: 'export_document',
  description: 'Export a document as markdown',
  inputSchema: {
    id: z.string().describe('ID of the document to export'),
  },
  async callback(args) {
    try {
      const client = getOutlineClient();
      const response = await client.post('/documents.export', {
        id: args.id,
      });
      return { content: [{ type: 'text', text: JSON.stringify(response.data.data) }] };
    } catch (error: any) {
      console.error('Error exporting document:', error.message);
      throw new McpError(ErrorCode.InvalidRequest, error.message);
    }
  },
});
