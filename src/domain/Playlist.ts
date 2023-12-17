import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { Entity } from './Entity.js'
import { Sound } from './Sound.js'

export const PlaylistCreationSchema = z.object({
  title: z.string(),
  sounds: z.array(z.string()),
  id: z
    .string()
    .optional()
    .default(() => new ObjectId().toHexString())
})
export type PlaylistCreation = z.infer<typeof PlaylistCreationSchema>

export class Playlist extends Entity<typeof Playlist> {
  static collectionName = 'playlists'

  sounds: Sound['id'][] = []
  title: string

  constructor(data: unknown) {
    const validatedData = PlaylistCreationSchema.parse(data)

    super(validatedData.id)
    this.title = validatedData.title
    this.sounds = validatedData.sounds
  }
}
