import { MongoClient } from 'mongodb'
import { AppConfig } from '../config.js'
import { DatabaseConnectionError } from '../domain/errors/DatabaseConnection.js'

async function connect(config: AppConfig['database']) {
  const client = new MongoClient(config.connectionString)
  const connection = await client.connect()
  const database = connection.db(config.dbName)

  return {
    client,
    connection,
    database,
    async shutdown() {
      await client.close()
    }
  }
}

export async function createConnection(config: AppConfig, retries = 5) {
  try {
    config.logger.info('Connecting to database... Try %d of 5', 5 - retries + 1)
    const connection = await connect(config.database)
    config.logger.info('Connected to database')
    return connection
  } catch (error) {
    if (retries === 0) {
      config.logger.error({ msg: 'Could not connect to database', error, stack: (error as Error).stack })
      throw new DatabaseConnectionError(error as Error)
    }
    config.logger.warn(`Retrying connection to database, ${retries - 1} attempts left`)
    return await createConnection(config, retries - 1)
  }
}
