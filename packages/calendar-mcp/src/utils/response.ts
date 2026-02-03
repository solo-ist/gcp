import type { TextContent } from '@modelcontextprotocol/sdk/types.js';

export function textResponse(text: string): { content: TextContent[] } {
  return {
    content: [{ type: 'text', text }],
  };
}

export function jsonResponse(data: unknown): { content: TextContent[] } {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

export function errorResponse(message: string): { content: TextContent[]; isError: true } {
  return {
    content: [{ type: 'text', text: `Error: ${message}` }],
    isError: true,
  };
}
