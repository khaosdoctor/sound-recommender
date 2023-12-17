import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { Entity } from './Entity.js'

export const SoundCredit = z.object({
  name: z.string(),
  role: z.string()
})
export type SoundCredit = z.infer<typeof SoundCredit>

export const SoundCreationSchema = z.object({
  id: z
    .string()
    .optional()
    .default(() => new ObjectId().toHexString()),
  title: z.string(),
  bpm: z.number(),
  genres: z.array(z.string()),
  duration_in_seconds: z.number(),
  credits: z.array(SoundCredit).nonempty()
})
export type SoundCreation = z.infer<typeof SoundCreationSchema>

export class Sound extends Entity<typeof Sound> {
  static collectionName = 'sounds'
  title: string
  bpm: number
  genres: string[]
  duration_in_seconds: number
  credits: SoundCredit[]

  constructor(data: unknown) {
    const validatedData = SoundCreationSchema.parse(data)
    super(validatedData.id)

    this.title = validatedData.title
    this.bpm = validatedData.bpm
    this.genres = validatedData.genres
    this.duration_in_seconds = validatedData.duration_in_seconds
    this.credits = validatedData.credits
  }
}
