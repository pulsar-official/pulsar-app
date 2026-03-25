import { verifySignatureAppRouter } from '@upstash/qstash/nextjs'
import type { Job } from '@/lib/queue'

async function handler(req: Request) {
  const job = await req.json() as Job

  switch (job.type) {
    case 'send_welcome_email': {
      // TODO: wire up your email provider (Resend, SendGrid, etc.)
      const { userId, email } = job.payload as { userId: string; email: string }
      console.log(`[qstash] send_welcome_email → userId=${userId} email=${email}`)
      break
    }

    case 'send_verification_email': {
      const { userId, email } = job.payload as { userId: string; email: string; token: string }
      console.log(`[qstash] send_verification_email → userId=${userId} email=${email}`)
      break
    }

    case 'ai_process_background': {
      // TODO: run background AI processing
      const { userId } = job.payload as { userId: string; prompt: string; context: unknown }
      console.log(`[qstash] ai_process_background → userId=${userId}`)
      break
    }

    case 'webhook_delivery': {
      const { targetUrl, payload } = job.payload as { targetUrl: string; payload: unknown }
      await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      break
    }

    default:
      console.warn('[qstash] Unknown job type:', (job as Job).type)
  }

  return Response.json({ ok: true })
}

// Verifies QStash's HMAC signature before running the handler
export const POST = verifySignatureAppRouter(handler)
