import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { createTokenManager, type TokenManager, type Account } from '@solo-ist/auth';
import { CalendarClient } from './calendar/client.js';
import {
  listEventsSchema,
  getEventSchema,
  createEventSchema,
  deleteEventSchema,
  findFreeTimeSchema,
} from './tools/schemas.js';
import { listEvents } from './tools/list-events.js';
import { getEvent } from './tools/get-event.js';
import { createEvent } from './tools/create-event.js';
import { deleteEvent } from './tools/delete-event.js';
import { findFreeTime } from './tools/find-free-time.js';
import { textResponse, errorResponse } from './utils/response.js';

const READ_ONLY_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events.readonly',
  'https://www.googleapis.com/auth/calendar.freebusy',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

const READ_WRITE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.freebusy',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

const READ_ONLY_TOOLS = ['list_events', 'get_event', 'find_free_time'];
const WRITE_TOOLS = ['create_event', 'delete_event'];

interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: object;
}

function getEnabledTools(): Set<string> {
  const envTools = process.env.ENABLED_TOOLS;
  if (envTools) {
    return new Set(envTools.split(',').map(t => t.trim()));
  }
  // Default to read-only tools
  return new Set(READ_ONLY_TOOLS);
}

export async function createServer(): Promise<{ server: Server; transport: StdioServerTransport }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const credentialsFile = process.env.GOOGLE_CREDENTIALS_FILE;

  const enabledTools = getEnabledTools();
  const needsWriteScope = WRITE_TOOLS.some(tool => enabledTools.has(tool));
  const scopes = needsWriteScope ? READ_WRITE_SCOPES : READ_ONLY_SCOPES;

  const tokenManager = await createTokenManager({
    clientId,
    clientSecret,
    credentialsFile,
    scopes,
  });

  const server = new Server(
    {
      name: 'calendar-mcp',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  const allTools: ToolDefinition[] = [
    {
      name: 'list_events',
      description: 'List calendar events within a date range. Returns event summaries, times, and IDs.',
      inputSchema: zodToJsonSchema(listEventsSchema),
    },
    {
      name: 'get_event',
      description: 'Get detailed information about a specific calendar event by ID.',
      inputSchema: zodToJsonSchema(getEventSchema),
    },
    {
      name: 'create_event',
      description: 'Create a new calendar event with title, start/end times, and optional attendees.',
      inputSchema: zodToJsonSchema(createEventSchema),
    },
    {
      name: 'delete_event',
      description: 'Delete a calendar event by ID.',
      inputSchema: zodToJsonSchema(deleteEventSchema),
    },
    {
      name: 'find_free_time',
      description: 'Query free/busy information for one or more calendars within a time range.',
      inputSchema: zodToJsonSchema(findFreeTimeSchema),
    },
  ];

  // Add auth management tools
  const authTools: ToolDefinition[] = [
    {
      name: 'auth_add_account',
      description: 'Start OAuth flow to add a Google account. Returns an authorization URL to visit.',
      inputSchema: {
        type: 'object',
        properties: {
          accountId: {
            type: 'string',
            description: 'A unique identifier for this account (e.g., "work" or "personal")',
          },
        },
        required: ['accountId'],
      },
    },
    {
      name: 'auth_complete',
      description: 'Complete OAuth flow by providing the authorization code from Google.',
      inputSchema: {
        type: 'object',
        properties: {
          accountId: {
            type: 'string',
            description: 'The account ID used in auth_add_account',
          },
          code: {
            type: 'string',
            description: 'The authorization code from Google',
          },
        },
        required: ['accountId', 'code'],
      },
    },
    {
      name: 'auth_list_accounts',
      description: 'List all authenticated Google accounts.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'auth_remove_account',
      description: 'Remove a Google account and its stored credentials.',
      inputSchema: {
        type: 'object',
        properties: {
          accountId: {
            type: 'string',
            description: 'The account ID to remove',
          },
        },
        required: ['accountId'],
      },
    },
  ];

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const calendarTools = allTools.filter(tool => enabledTools.has(tool.name));
    return { tools: [...calendarTools, ...authTools] };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    // Handle auth tools
    if (name === 'auth_add_account') {
      const { accountId } = args as { accountId: string };
      const authUrl = await tokenManager.addAccount(accountId);
      return textResponse(
        `Visit this URL to authorize access:\n\n${authUrl}\n\nAfter authorizing, copy the code and call auth_complete with it.`
      );
    }

    if (name === 'auth_complete') {
      const { accountId, code } = args as { accountId: string; code: string };
      try {
        const account = await tokenManager.completeAuth(accountId, code);
        return textResponse(
          `Successfully authenticated as ${account.email} (${account.name ?? 'no name'})`
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return errorResponse(`Failed to complete auth: ${message}`);
      }
    }

    if (name === 'auth_list_accounts') {
      const accounts = await tokenManager.listAccounts();
      if (accounts.length === 0) {
        return textResponse('No accounts configured. Use auth_add_account to add one.');
      }
      return textResponse(
        'Configured accounts:\n' +
        accounts.map(a => `- ${a.id}: ${a.email} (added ${a.addedAt})`).join('\n')
      );
    }

    if (name === 'auth_remove_account') {
      const { accountId } = args as { accountId: string };
      await tokenManager.removeAccount(accountId);
      return textResponse(`Account ${accountId} removed`);
    }

    // Check if tool is enabled
    if (!enabledTools.has(name)) {
      return errorResponse(`Tool "${name}" is not enabled. Set ENABLED_TOOLS env var to enable it.`);
    }

    // Get default account for calendar operations
    const accounts = await tokenManager.listAccounts();
    if (accounts.length === 0) {
      return errorResponse(
        'No accounts configured. Use auth_add_account to add a Google account first.'
      );
    }

    const accountId = accounts[0].id;
    const authClient = await tokenManager.getAuthenticatedClient(accountId);
    const calendarClient = new CalendarClient(authClient);

    // Handle calendar tools
    switch (name) {
      case 'list_events': {
        const input = listEventsSchema.parse(args);
        return listEvents(calendarClient, input);
      }
      case 'get_event': {
        const input = getEventSchema.parse(args);
        return getEvent(calendarClient, input);
      }
      case 'create_event': {
        const input = createEventSchema.parse(args);
        return createEvent(calendarClient, input);
      }
      case 'delete_event': {
        const input = deleteEventSchema.parse(args);
        return deleteEvent(calendarClient, input);
      }
      case 'find_free_time': {
        const input = findFreeTimeSchema.parse(args);
        return findFreeTime(calendarClient, input);
      }
      default:
        return errorResponse(`Unknown tool: ${name}`);
    }
  });

  const transport = new StdioServerTransport();
  return { server, transport };
}
