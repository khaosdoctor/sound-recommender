import { Request, Response } from 'express'
import { ServiceList } from '../app.js'
import { Sound, SoundCreationSchema } from '../domain/Sound.js'
import { z } from 'zod'

const inputSchema = z.object({
  data: z.array(SoundCreationSchema.omit({ id: true })).nonempty()
})

export default function handlerFactory(services: ServiceList) {
  return async (req: Request, res: Response) => {
    const input = inputSchema.parse(req.body)
    const sounds = input.data.map((sound) => new Sound(sound))
    await services.sound.create(sounds)

    res.status(201).json({ data: sounds.map((s) => s.toObject()) })
  }
}
