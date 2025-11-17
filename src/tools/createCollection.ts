import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { getOutlineClient } from '../outline/outlineClient.js';
import toolRegistry from '../utils/toolRegistry.js';
import z from 'zod';

// Register this tool
toolRegistry.register('create_collection', {
  name: 'create_collection',
  description: 'Create a new collection',
  inputSchema: {
    name: z.string().describe('Title of the collection'),
    description: z.string().describe('Content of the collection in markdown format').optional(),
    permission: z
      .enum(['read', 'read_write'])
      .describe('Permission level for the collection')
      .optional(),
    color: z.string().describe('Hex color code for the collection').optional(),
    icon: z.string().describe('Icon for the collection (emoji or outline-icons package name)').optional(),
    sharing: z.boolean().describe('Whether public sharing of documents is allowed').optional(),
  },
  async callback(args) {
    try {
      const payload: Record<string, any> = {
        name: args.name,
      };

      if (args.description !== undefined) {
        payload.description = args.description;
      }

      if (args.permission !== undefined) {
        payload.permission = args.permission;
      }

      if (args.color !== undefined) {
        payload.color = args.color;
      }

      if (args.icon !== undefined) {
        payload.icon = args.icon;
      }

      if (args.sharing !== undefined) {
        payload.sharing = args.sharing;
      }

      const client = getOutlineClient();
      const response = await client.post('/collections.create', payload);
      return { content: [{ type: 'text', text: JSON.stringify(response.data.data) }] };
    } catch (error: any) {
      console.error('Error creating collection:', error.message);
      throw new McpError(ErrorCode.InvalidRequest, error.message);
    }
  },
});
