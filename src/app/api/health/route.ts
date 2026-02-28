export async function GET() {
  return Response.json({
    status: 'ok',
    timestamp: new Date(),
    environment: process.env.NODE_ENV,
  })
}