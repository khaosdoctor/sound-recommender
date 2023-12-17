import { Db } from 'mongodb'
import { Playlist, PlaylistCreation } from '../domain/Playlist.js'
import { NotFoundError } from '../domain/errors/NotFoundError.js'

/**
 * Since this is just meant to satisfy the functional requirements
 * and NOT to be a production ready API
 * I'm going to use the database driver directly here
 * however, in a real world scenario, I would use another layer of abstraction
 * to decouple the application from the database driver using the Repository Pattern
 */
export class PlaylistService {
  private readonly collection

  constructor(database: Db) {
    this.collection = database.collection<PlaylistCreation>(Playlist.collectionName)
  }

  async findById(id: string) {
    const document = await this.collection.findOne({ id })
    if (!document) throw new NotFoundError(Playlist, id)

    return new Playlist(document)
  }

  async findAll() {
    const documents = await this.collection.find().toArray()
    const playlists = documents.map((document) => new Playlist(document))
    return playlists
  }

  async create(playlists: Playlist[]) {
    await this.collection.insertMany(playlists.map((p) => p.toDocument()))
    return playlists
  }
}
