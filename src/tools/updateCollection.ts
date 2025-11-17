import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { getOutlineClient } from '../outline/outlineClient.js';
import toolRegistry from '../utils/toolRegistry.js';
import z from 'zod';

// Register this tool
toolRegistry.register('update_collection', {
  name: 'update_collection',
  description: 'Update an existing collection',
  inputSchema: {
    id: z.string().describe('ID of the collection to update'),
    name: z.string().describe('New name for the collection (optional)').optional(),
    description: z.string().describe('New description for the collection (optional)').optional(),
    permission: z
      .string()
      .describe('New permission setting for the collection (optional)')
      .optional(),
    color: z.string().describe('New color for the collection (optional)').optional(),
    icon: z.string().describe('New icon for the collection (emoji or outline-icons package name) (optional)').optional(),
    sharing: z.boolean().describe('Whether public sharing of documents is allowed (optional)').optional(),
  },
  async callback(args) {
    try {
      const payload: Record<string, any> = {
        id: args.id,
      };

      if (args.name) {
        payload.name = args.name;
      }

      if (args.description !== undefined) {
        payload.description = args.description;
      }

      if (args.permission) {
        payload.permission = args.permission;
      }

      if (args.color) {
        payload.color = args.color;
      }

      if (args.icon !== undefined) {
        payload.icon = args.icon;
      }

      if (args.sharing !== undefined) {
        payload.sharing = args.sharing;
      }

      const client = getOutlineClient();
      const response = await client.post('/collections.update', payload);
      return { content: [{ type: 'text', text: JSON.stringify(response.data.data) }] };
    } catch (error: any) {
      console.error('Error updating collection:', error.message);
      throw new McpError(ErrorCode.InvalidRequest, error.message);
    }
  },
});
