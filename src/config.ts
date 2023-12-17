import path from 'path'
import { pino } from 'pino'
import { fileURLToPath } from 'url'
import { z } from 'zod'

const AppConfigSchema = z
  .object({
    MONGODB_CONNECTIONSTRING: z.string().optional().default('mongodb://localhost:27017'),
    MONGODB_DBNAME: z.string().optional().default('sound-recommender'),
    SERVER_PORT: z.string().default('8080').transform(Number),
    NODE_ENV: z.string().default('production')
  })
  .transform((envs) => ({
    database: {
      connectionString: envs.MONGODB_CONNECTIONSTRING,
      dbName: envs.MONGODB_DBNAME
    },
    server: {
      port: envs.SERVER_PORT
    },
    isProduction: envs.NODE_ENV === 'production',
    logger: pino({
      ...(envs.NODE_ENV !== 'production' && { transport: { target: 'pino-pretty' } }),
      level: envs.NODE_ENV === 'production' ? 'info' : 'debug',
      name: 'sound-recommender',
      redact: envs.NODE_ENV === 'production' ? ['stack', 'req.headers.authorization'] : []
    })
  }))

export const appConfig = AppConfigSchema.parse(process.env)
appConfig.logger
export type AppConfig = z.infer<typeof AppConfigSchema>
