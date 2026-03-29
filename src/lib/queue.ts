import { Client as QStashClient } from '@upstash/qstash'

export const qstash = new QStashClient({
  token: process.env.QSTASH_TOKEN!,
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pulsar.zone'

export type JobType =
  | 'send_welcome_email'
  | 'send_verification_email'
  | 'ai_process_background'
  | 'webhook_delivery'

export interface Job<T = Record<string, unknown>> {
  type: JobType
  payload: T
}

export async function enqueueJob<T>(
  job: Job<T>,
  options?: { delay?: number; retries?: number },
): Promise<void> {
  await qstash.publishJSON({
    url: `${APP_URL}/api/qstash/process`,
    body: job,
    delay: options?.delay,
    retries: options?.retries ?? 3,
  })
}

export const Jobs = {
  sendWelcomeEmail: (userId: string, email: string) =>
    enqueueJob({ type: 'send_welcome_email', payload: { userId, email } }),

  sendVerificationEmail: (userId: string, email: string, token: string) =>
    enqueueJob({ type: 'send_verification_email', payload: { userId, email, token } }),

  processAiBackground: (userId: string, prompt: string, context: unknown) =>
    enqueueJob(
      { type: 'ai_process_background', payload: { userId, prompt, context } },
      { retries: 2 },
    ),

  deliverWebhook: (targetUrl: string, payload: unknown) =>
    enqueueJob(
      { type: 'webhook_delivery', payload: { targetUrl, payload } },
      { retries: 5 },
    ),
}
