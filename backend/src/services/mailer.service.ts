import { env } from '../config/env'

/**
 * Отправка писем через HTTP API Resend — обычным fetch, без SDK.
 *
 * Если RESEND_API_KEY пуст, письмо не отправляется, а ссылка пишется в
 * лог. Это сознательный компромисс: регистрация и сброс пароля должны
 * работать в локальной разработке без почтового провайдера, и отсутствие
 * ключа не должно превращаться в 500 на форме регистрации. В production
 * без ключа в лог пишется предупреждение — молча терять письма нельзя.
 */

interface SendMailInput {
  to: string
  subject: string
  html: string
  /** Куда ведёт письмо — дублируется в лог, чтобы ссылку можно было
   * скопировать из консоли, не вычитывая её из HTML. */
  link: string
}

export async function sendMail({ to, subject, html, link }: SendMailInput): Promise<void> {
  if (!env.RESEND_API_KEY) {
    if (env.NODE_ENV === 'production') {
      console.warn(`RESEND_API_KEY не задан — письмо «${subject}» для ${to} НЕ отправлено.`)
    } else {
      console.log(`[mail] ${subject} → ${to}\n[mail] ${link}`)
    }
    return
  }

  let response: Response
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: env.MAIL_FROM, to, subject, html }),
    })
  } catch (error) {
    // Сбой почты не должен ронять сам запрос: пользователь уже
    // зарегистрирован, а письмо можно перезапросить.
    console.error('Не удалось обратиться к Resend:', error)
    return
  }

  if (!response.ok) {
    console.error(`Resend отклонил письмо (${response.status}):`, await response.text())
  }
}

const FRONTEND = () => env.FRONTEND_URL.replace(/\/$/, '')

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const link = `${FRONTEND()}/auth/callback?token=${token}&purpose=email_verification`
  await sendMail({
    to,
    subject: 'Planly — подтвердите email',
    link,
    html: emailTemplate(
      'Подтвердите email',
      'Остался один шаг: подтвердите адрес, чтобы закончить регистрацию в Planly.',
      'Подтвердить email',
      link,
    ),
  })
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const link = `${FRONTEND()}/reset-password?token=${token}`
  await sendMail({
    to,
    subject: 'Planly — сброс пароля',
    link,
    html: emailTemplate(
      'Сброс пароля',
      'Вы запросили новый пароль для Planly. Ссылка действует один час. Если это были не вы — просто проигнорируйте письмо.',
      'Задать новый пароль',
      link,
    ),
  })
}

function emailTemplate(title: string, body: string, cta: string, link: string): string {
  return `<!doctype html>
<html lang="ru">
  <body style="margin:0;padding:32px;background:#FAFAFA;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#111827">
    <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:32px">
      <h1 style="margin:0 0 12px;font-size:20px">${title}</h1>
      <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#4B5563">${body}</p>
      <a href="${link}" style="display:inline-block;padding:12px 20px;border-radius:10px;background:#2563EB;color:#fff;font-size:14px;text-decoration:none">${cta}</a>
      <p style="margin:24px 0 0;font-size:12px;color:#9CA3AF;word-break:break-all">${link}</p>
    </div>
  </body>
</html>`
}
