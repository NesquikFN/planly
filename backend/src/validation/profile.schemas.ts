import { z } from 'zod'

// null здесь значимо: «очистить поле». Поэтому nullable(), а не просто
// optional() — иначе стереть однажды заполненную должность было бы
// невозможно.
const optionalText = (max: number) => z.string().trim().max(max).nullish()

export const updateProfileSchema = z
  .object({
    fullName: optionalText(200),
    firstName: optionalText(100),
    lastName: optionalText(100),
    displayName: optionalText(200),
    phone: optionalText(50),
    jobTitle: optionalText(200),
    company: optionalText(200),
    bio: optionalText(2000),
    // Аватар хранится data-URL'ом прямо в строке профиля (так же, как
    // было в Supabase). Лимит примерно соответствует картинке на ~700 КБ
    // после base64 — и он же не даёт превысить лимит тела запроса.
    avatarUrl: z.string().max(1_000_000).nullish(),
    timezone: z.string().trim().min(1).max(100).optional(),
    language: z.string().trim().min(2).max(10).optional(),
  })
  .refine((patch) => Object.keys(patch).length > 0, {
    message: 'Пустое тело запроса: нечего обновлять',
  })
