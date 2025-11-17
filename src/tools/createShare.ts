import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { getOutlineClient } from '../outline/outlineClient.js';
import toolRegistry from '../utils/toolRegistry.js';
import z from 'zod';

// Register this tool
toolRegistry.register('create_share', {
  name: 'create_share',
  description: 'Create a public share link for a document',
  inputSchema: {
    documentId: z.string().describe('ID of the document to share'),
    expiresIn: z
      .number()
      .describe('Number of milliseconds until the share expires (optional)')
      .optional(),
    password: z.string().describe('Password to protect the share (optional)').optional(),
    allowDownload: z
      .boolean()
      .describe('Whether to allow downloading the document (optional)')
      .optional(),
  },
  async callback(args) {
    try {
      const payload: Record<string, any> = {
        documentId: args.documentId,
      };

      if (args.expiresIn !== undefined) {
        payload.expiresIn = args.expiresIn;
      }

      if (args.password) {
        payload.password = args.password;
      }

      if (args.allowDownload !== undefined) {
        payload.allowDownload = args.allowDownload;
      }

      const client = getOutlineClient();
      const response = await client.post('/shares.create', payload);
      return { content: [{ type: 'text', text: JSON.stringify(response.data.data) }] };
    } catch (error: any) {
      console.error('Error creating share:', error.message);
      throw new McpError(ErrorCode.InvalidRequest, error.message);
    }
  },
});
