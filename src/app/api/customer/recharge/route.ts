import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      message: "Recharge API placeholder. Current MVP uses localStorage mock data.",
    },
    { status: 501 },
  );
}
