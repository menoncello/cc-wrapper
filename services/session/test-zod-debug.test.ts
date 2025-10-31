import { z } from 'zod';

console.log('Testing basic Zod functionality...');

// Test basic schema
const BasicSchema = z.object({
  id: z.string().uuid(),
  name: z.string()
});

try {
  const result = BasicSchema.safeParse({
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'test'
  });
  console.log('Basic schema test:', result.success);
} catch (error) {
  console.error('Basic schema error:', error);
}

// Test array schema
const ArraySchema = z.array(z.string());

try {
  const result = ArraySchema.safeParse(['a', 'b', 'c']);
  console.log('Array schema test:', result.success);
} catch (error) {
  console.error('Array schema error:', error);
}

// Test complex schema like our workspace state
const ComplexSchema = z.object({
  terminalState: z.array(z.object({
    id: z.string().uuid(),
    cwd: z.string(),
    isActive: z.boolean()
  })),
  browserTabs: z.array(z.object({
    id: z.string().uuid(),
    url: z.string(),
    title: z.string(),
    isActive: z.boolean()
  })),
  aiConversations: z.array(z.object({
    id: z.string().uuid(),
    sessionId: z.string().uuid(),
    messages: z.array(z.object({
      id: z.string().uuid(),
      role: z.enum(['user', 'assistant']),
      content: z.string(),
      timestamp: z.date()
    })),
    createdAt: z.date(),
    updatedAt: z.date()
  })),
  openFiles: z.array(z.object({
    id: z.string().uuid(),
    path: z.string(),
    content: z.string(),
    isDirty: z.boolean()
  }))
});

try {
  const minimalData = {
    terminalState: [],
    browserTabs: [],
    aiConversations: [],
    openFiles: []
  };
  const result = ComplexSchema.safeParse(minimalData);
  console.log('Complex schema test:', result.success);
} catch (error) {
  console.error('Complex schema error:', error);
}