export async function POST() {
  return Response.json({
    ok: true,
    message: "Wechat Pay callback placeholder. Current MVP stores payment settings only and does not call real WeChat Pay.",
  });
}

export async function GET() {
  return Response.json({
    ok: true,
    message: "Wechat Pay callback placeholder.",
  });
}
