import { app } from './app'
import { env } from './config/env'

app.listen(env.PORT, () => {
  console.log(`Planly API слушает http://localhost:${env.PORT}`)
})
