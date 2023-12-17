import Express, { NextFunction, Request, Response } from 'express'
import 'express-async-errors'
import helmet from 'helmet'
import { Server } from 'http'
import { pinoHttp } from 'pino-http'
import { ZodError } from 'zod'
import { AppConfig, appConfig } from './config.js'
import { createConnection } from './data/createConnection.js'
import { Sound } from './domain/Sound.js'
import { loadRoutes } from './routes/index.js'
import { PlaylistService } from './services/PlaylistService.js'
import { RecommenderService } from './services/RecommenderService.js'
import { SoundService } from './services/SoundService.js'
export type ServiceList = Awaited<ReturnType<typeof initializeResources>>['services']

async function initializeResources(config: AppConfig) {
  config.logger.info('Initializing application')
  const { database, shutdown } = await createConnection(config)

  const playlist = new PlaylistService(database)
  const recommender = new RecommenderService()
  const sound = new SoundService(database, recommender)

  // seed the database (debug only for faster setup)
  if ((await sound.findAll()).length === 0) {
    config.logger.info('Seeding database, this is just for the demo, not for production!')
    const seed = (await import('./data/sounds.json', { with: { type: 'json' } })).default
    await sound.create(seed.map((s) => new Sound(s)))
  }

  await recommender.addSoundsToGraph(await sound.findAll())

  return {
    services: {
      sound,
      playlist,
      recommender
    },
    async releaseResources() {
      config.logger.info('Releasing database connection')
      await shutdown()
    }
  }
}

export default async function initialize(config: AppConfig) {
  const { services, releaseResources } = await initializeResources(config)
  const app = Express()
  app.use(pinoHttp({ logger: config.logger, quietReqLogger: config.isProduction }))
  app.use(Express.json())
  app.use(helmet())
  app.use(loadRoutes(services))
  app.use(async (error: Error, req: Request, res: Response, next: NextFunction) => {
    if (!error) next()
    config.logger.error({ error, url: req.url, method: req.method }, 'Error while processing request')

    // Especially handling validation errors
    if (error instanceof ZodError) {
      return res.status(422).json({
        message: 'Invalid input',
        name: 'InvalidInput',
        issues: error.issues
      })
    }

    // Handling errors with status code
    if (error instanceof Error && 'status' in error) {
      return res.status(Number(error?.status)).json({
        message: error.message,
        name: error.name
      })
    }

    return res.status(500).json({
      message: 'Internal server error',
      name: 'InternalServerError'
    })
  })

  let server: Server
  return {
    async start() {
      config.logger.info('Starting server')
      server = app.listen(config.server.port, () => {
        config.logger.info(`Server listening on port %d`, config.server.port)
      })
    },
    async stop() {
      await releaseResources()
      config.logger.info('Stopping server')
      server.close()
    }
  }
}

appConfig.logger.debug('Initializing application')
const { start, stop } = await initialize(appConfig)

appConfig.logger.debug('Application initialized, registering shutdown hooks')
process
  .on('SIGINT', async () => {
    appConfig.logger.warn('Received SIGINT')
    await stop()
    process.exit(9)
  })
  .on('SIGTERM', async () => {
    appConfig.logger.warn('Received SIGTERM')
    await stop()
    process.exit(8)
  })
  .on('uncaughtException', async (error) => {
    appConfig.logger.error('Uncaught exception: %O', error)
    await stop()
    process.exit(1)
  })
  .on('unhandledRejection', async (reason) => {
    appConfig.logger.error('Unhandled rejection: %O', reason)
  })

await start()
