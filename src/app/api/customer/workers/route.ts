import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      message: "Workers API placeholder. Current MVP uses localStorage mock data.",
    },
    { status: 501 },
  );
}
