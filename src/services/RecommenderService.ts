import { createHash } from 'node:crypto'
import { appConfig } from '../config.js'
import { Sound } from '../domain/Sound.js'

export class RecommenderService {
  #recommendationGraph: Map<string, string[]> = new Map()

  async addSoundToGraph(sound: Sound) {
    if (this.#recommendationGraph.has(sound.id)) return
    const soundSet = [
      String(sound.bpm),
      ...sound.genres,
      String(sound.duration_in_seconds),
      ...sound.credits.map((credit) => createHash('sha256').update(JSON.stringify(credit.name)).digest('hex'))
    ]
    this.#recommendationGraph.set(sound.id, soundSet)
    appConfig.logger.debug({ soundId: sound.id, soundSet }, 'Added sound event')
    return soundSet
  }

  async addSoundsToGraph(sounds: Sound[]) {
    appConfig.logger.debug('Adding sound events: Building recommendation graph')
    return Promise.all(sounds.map((sound) => this.addSoundToGraph(sound)))
  }

  async compare(soundAId: string, soundBId: string) {
    // Comparison using Jaccard Index based on
    // https://medium.com/@lgrees/creating-a-simple-recommendation-engine-using-javascript-and-neo4j-c0fe9859c469
    const soundA = this.#recommendationGraph.get(soundAId)
    const soundB = this.#recommendationGraph.get(soundBId)
    if (!soundA || !soundB) return 0

    const intersection = soundA.filter((value) => soundB.includes(value))
    const union = [...new Set([...soundA, ...soundB])]
    const index = intersection.length / union.length
    appConfig.logger.trace({ intersection, union, soundA, soundB }, 'Jaccard Index: %d', index)
    return index
  }

  async getRecommendationsForSounds(soundIds: string[]) {
    const songsToCompare = [...this.#recommendationGraph.entries()].filter(([id]) => !soundIds.includes(id))

    const recommendations = (
      await Promise.all(
        soundIds.map(async (userSongId) => {
          appConfig.logger.debug('Comparing %d songs to %s', songsToCompare.length, userSongId)
          const recommendations = await Promise.all(
            songsToCompare.map(async ([databaseSongId]) => ({
              id: databaseSongId,
              score: await this.compare(userSongId, databaseSongId)
            }))
          )
          appConfig.logger.debug({ userSongId, recommendations }, 'Partial recommendations for song')
          return recommendations
        })
      )
    ).reduce((acc, curr) => [...acc, ...curr], [])

    const sorted = recommendations.filter((r) => r.score > 0).toSorted((a, b) => b.score - a.score)
    appConfig.logger.debug({ recommendations: sorted }, 'Final recommendations for songs')
    return sorted.slice(0, 5)
  }
}
