// ============================================================
// VIBEMILES — AI TRAVEL ASSISTANT CHAT API
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/server/auth/guard';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/server/auth/session';
import { prisma } from '@/lib/prisma';
import { checkAssistantRateLimit, validateAndSanitizeUserInput } from '@/server/ai/guardrails';
import { AiProviderAdapter } from '@/server/ai/adapter';
import type { AssistantChatMessage } from '@/server/ai/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Identify Client for Rate Limiting
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    // 2. Resolve Session (Optional: Guests allowed, but suspended users strictly blocked)
    const sessionAuth = await getSessionUser();
    let effectiveUserId = sessionAuth?.user?.id;
    let isUserSuspended = sessionAuth?.user?.status === 'SUSPENDED';

    if (!isUserSuspended) {
      // Check if there is a session token belonging to a suspended account
      const cookieValue = req.cookies.get(SESSION_COOKIE_NAME)?.value;
      if (cookieValue) {
        const payload = await verifySessionToken(cookieValue);
        if (payload?.userId) {
          effectiveUserId = payload.userId;
          const userInDb = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { status: true },
          });
          if (userInDb?.status === 'SUSPENDED') {
            isUserSuspended = true;
          }
        }
      }
    }

    // Safety: Enforce account suspension check
    if (isUserSuspended) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied: Your account is currently suspended from using the AI travel assistant.',
        },
        { status: 403 }
      );
    }

    const rateLimitKey = effectiveUserId ? `user:${effectiveUserId}` : `ip:${ip}`;

    // Rate Limiting Check: 20 requests per minute
    const rateCheck = checkAssistantRateLimit(rateLimitKey, 20, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Rate limit exceeded. Please wait ${rateCheck.retryAfterSeconds} seconds before sending another travel inquiry.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) },
        }
      );
    }

    // 3. Parse and Validate Request Payload
    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid request: "messages" array is required.' },
        { status: 400 }
      );
    }

    const rawMessages: unknown[] = body.messages;
    const validMessages: AssistantChatMessage[] = [];

    for (const m of rawMessages) {
      if (
        typeof m === 'object' &&
        m !== null &&
        'role' in m &&
        'content' in m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string'
      ) {
        validMessages.push({
          role: m.role as 'user' | 'assistant',
          content: m.content.trim(),
        });
      }
    }

    if (validMessages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid user or assistant messages provided.' },
        { status: 400 }
      );
    }

    const lastUserMsg = [...validMessages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) {
      return NextResponse.json(
        { success: false, error: 'Conversation must contain at least one user message.' },
        { status: 400 }
      );
    }

    // 4. Validate and Sanitize User Prompt against Jailbreaks / Injection
    const validation = validateAndSanitizeUserInput(lastUserMsg.content);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: true,
          data: {
            message: validation.error || 'Your inquiry could not be processed.',
            packages: undefined,
            isFallback: true,
            provider: 'deterministic-fallback',
          },
        },
        { status: 200 }
      );
    }

    // Update sanitized text in the last message
    lastUserMsg.content = validation.sanitized;

    // 5. Execute Provider Adapter
    const assistantResult = await AiProviderAdapter.processChat(validMessages, 15000);

    return NextResponse.json({
      success: true,
      data: assistantResult,
    });
  } catch (error: unknown) {
    console.error('[AI Assistant API Error]:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred while processing your travel inquiry.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
