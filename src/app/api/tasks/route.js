export async function GET() {\n  return new Response(JSON.stringify({ message: "tasks api" }), { status: 200 });\n}\n
