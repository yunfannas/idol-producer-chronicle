import { NextResponse } from "next/server";
import { MOCK_INBOX } from "@/lib/mock/inbox";

/**
 * Mock Inbox feed. Query `?empty=1` for empty state, `?fail=1` for error.
 * Artificial delay so the client loading state is visible.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fail = searchParams.get("fail") === "1";
  const empty = searchParams.get("empty") === "1";

  await new Promise((resolve) => setTimeout(resolve, 450));

  if (fail) {
    return NextResponse.json(
      { error: "Inbox feed unavailable. Staff channel temporarily offline." },
      { status: 503 },
    );
  }

  return NextResponse.json({
    items: empty ? [] : MOCK_INBOX,
    generatedAt: new Date().toISOString(),
  });
}
