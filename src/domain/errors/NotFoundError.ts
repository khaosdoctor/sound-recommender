import { StaticEntity } from '../Entity.js'

export class NotFoundError extends Error {
  public status: number
  constructor(entity: StaticEntity, id: string) {
    super(`${entity.name} with id ${id} not found`)
    this.name = 'NotFoundError'
    this.status = 404
  }
}
