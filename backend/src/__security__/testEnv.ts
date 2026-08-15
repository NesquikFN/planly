/**
 * Модуль-побочный эффект: ДОЛЖЕН импортироваться ПЕРВЫМ в каждом
 * security-тесте, до любого импорта, который тянет config/env.
 *
 * Зачем: config/env делает `import 'dotenv/config'`, а backend/.env
 * разработчика указывает на боевую базу Railway. dotenv не
 * перезаписывает уже существующие переменные, поэтому выставленные здесь
 * значения выигрывают — и ни один тест физически не может открыть
 * соединение с продом. DATABASE_URL намеренно указывает в порт 1 на
 * localhost: если какой-то путь кода всё же попробует сделать запрос, он
 * сразу упадёт с ECONNREFUSED, а не уйдёт в реальную базу.
 */
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://planly_test:planly_test@127.0.0.1:1/planly_test'
process.env.JWT_SECRET = 'security-test-secret-not-used-anywhere-real'
process.env.FRONTEND_URL = 'https://frontend.test'
process.env.RESEND_API_KEY = ''
process.env.REQUIRE_EMAIL_VERIFICATION = 'false'

export const TEST_JWT_SECRET = process.env.JWT_SECRET
