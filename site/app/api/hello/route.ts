import { NextRequest, NextResponse } from "next/server";

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")?.trim() || "world";

  return NextResponse.json({
    message: `Hello, ${name}!`,
  });
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (
      !isObjectRecord(body) ||
      (body.name !== undefined && typeof body.name !== "string")
    ) {
      return NextResponse.json(
        { error: "Body must be an object with an optional string name." },
        { status: 400 },
      );
    }

    const name =
      typeof body.name === "string" ? body.name.trim() || "world" : "world";

    return NextResponse.json(
      { message: `Hello, ${name}!` },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }
}
