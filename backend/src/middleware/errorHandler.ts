import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { AppError } from '../utils/AppError'
import { env } from '../config/env'

/**
 * Ошибки body-parser (express.json) не являются ни AppError, ни
 * ZodError, поэтому без этой ветки слишком большой или битый payload
 * отдавал бы 500 «Внутренняя ошибка сервера» вместо честных 413/400 — и
 * засорял бы логи как «неизвестная ошибка».
 */
interface BodyParserError extends Error {
  status?: number
  statusCode?: number
  type?: string
}

const BODY_PARSER_CODES: Record<string, string> = {
  'entity.too.large': 'PAYLOAD_TOO_LARGE',
  'entity.parse.failed': 'INVALID_JSON',
  'encoding.unsupported': 'UNSUPPORTED_ENCODING',
  'request.aborted': 'REQUEST_ABORTED',
}

const BODY_PARSER_MESSAGES: Record<string, string> = {
  'entity.too.large': 'Тело запроса слишком большое',
  'entity.parse.failed': 'Некорректный JSON в теле запроса',
  'encoding.unsupported': 'Неподдерживаемая кодировка запроса',
  'request.aborted': 'Запрос прерван',
}

function asClientError(err: unknown): { status: number; code: string; message: string } | null {
  if (!(err instanceof Error)) return null
  const candidate = err as BodyParserError
  const status = candidate.status ?? candidate.statusCode
  if (typeof status !== 'number' || status < 400 || status >= 500) return null

  const type = candidate.type
  return {
    status,
    code: (type && BODY_PARSER_CODES[type]) ?? 'BAD_REQUEST',
    // Своя формулировка, а не err.message: сырые тексты body-parser
    // содержат подробности о лимитах и внутреннем состоянии парсера.
    message: (type && BODY_PARSER_MESSAGES[type]) ?? 'Некорректный запрос',
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Некорректные данные запроса',
        details: err.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    })
    return
  }

  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message },
    })
    return
  }

  const clientError = asClientError(err)
  if (clientError) {
    res.status(clientError.status).json({
      error: { code: clientError.code, message: clientError.message },
    })
    return
  }

  console.error(err)

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Внутренняя ошибка сервера',
      ...(env.NODE_ENV !== 'production' && err instanceof Error ? { stack: err.stack } : {}),
    },
  })
}
