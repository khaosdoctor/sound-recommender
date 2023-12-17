export class DatabaseConnectionError extends Error {
  public status: number
  constructor(error?: Error) {
    super(error?.message ?? 'Database connection error')
    this.name = 'DatabaseConnectionError'
    this.cause = error
    this.status = 500
  }
}
