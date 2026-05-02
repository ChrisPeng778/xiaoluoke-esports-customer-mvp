import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      message: "Customer orders API placeholder. Current MVP uses localStorage mock data.",
    },
    { status: 501 },
  );
}

export async function POST() {
  return NextResponse.json(
    {
      message: "Create order API placeholder. Current MVP uses localStorage mock data.",
    },
    { status: 501 },
  );
}
