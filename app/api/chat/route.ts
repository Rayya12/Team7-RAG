import { createResource } from '@/lib/actions/resources';
import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, tool, UIMessage } from 'ai';
import { z } from 'zod';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = await streamText({
    model: openai('gpt-4o'),
    system: 'You are a helpful assistant. Check your knowledge base before answering. Only respond to questions using information from tool calls. If no relevant information is found in the tool calls, respond, "Sorry, I don\'t know"',
    messages: convertToModelMessages(messages),
    tools: {
      addResource: tool({
        description: 'add a resource to your knowledge base. If the user provides a random piece of knowledge unprompted, use this tool',
        inputSchema: z.object({
          content: z.string().describe('the content or resource to add to the knowledge base'),
        }),
        execute: async ({ content }) => createResource({ content }),
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}

    

