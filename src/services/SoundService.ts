import { Collection, Db } from 'mongodb'
import { Sound } from '../domain/Sound.js'
import { NotFoundError } from '../domain/errors/NotFoundError.js'
import { Playlist } from '../domain/Playlist.js'
import { RecommenderService } from './RecommenderService.js'

/**
 * Since this is just meant to satisfy the functional requirements
 * and NOT to be a production ready API
 * I'm going to use the database driver directly here
 * however, in a real world scenario, I would use another layer of abstraction
 * to decouple the application from the database driver using the Repository Pattern
 */
export class SoundService {
  private readonly collection: Collection<ReturnType<Sound['toDocument']>>

  constructor(database: Db, private readonly recommender: RecommenderService) {
    this.collection = database.collection(Sound.collectionName)
  }

  async findById(id: string) {
    const document = await this.collection.findOne({ id })
    if (!document) throw new NotFoundError(Sound, id)
    return new Sound(document)
  }

  async findAll() {
    const documents = await this.collection.find().toArray()
    const sounds = documents.map((document) => new Sound(document))
    return sounds
  }

  async create(sounds: Sound[]) {
    await this.collection.insertMany(sounds.map((sound) => sound.toDocument()))
    this.recommender.addSoundsToGraph(sounds)

    return sounds
  }

  async getRecommendationByPlaylist(playlist: Playlist): Promise<{ score: number; sound: Sound }[]> {
    const recommendedSounds = await this.recommender.getRecommendationsForSounds(playlist.sounds)
    const sounds = await Promise.all(
      recommendedSounds.map(async ({ id, score }) => ({ score, sound: await this.findById(id) }))
    )

    return sounds
  }
}
