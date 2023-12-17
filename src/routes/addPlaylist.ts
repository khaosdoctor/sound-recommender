import { Request, Response } from 'express'
import { ServiceList } from '../app.js'
import { Playlist, PlaylistCreationSchema } from '../domain/Playlist.js'
import { z } from 'zod'

const inputSchema = z.object({
  data: z.array(PlaylistCreationSchema.omit({ id: true })).nonempty()
})

export default function handlerFactory(services: ServiceList) {
  return async (req: Request, res: Response) => {
    const input = inputSchema.parse(req.body)
    const playlists = input.data.map((playlist) => new Playlist(playlist))
    const createdPlaylists = await services.playlist.create(playlists)

    res.status(201).json({ data: createdPlaylists.map((p) => p.toObject()) })
  }
}
