import { Request, Response } from 'express'
import { ServiceList } from '../app.js'

export default function handlerFactory(services: ServiceList) {
  return async (_: Request<{ id: string }>, res: Response) => {
    const playlists = await services.playlist.findAll()
    return res.json({ data: playlists.map((playlist) => playlist?.toObject()) })
  }
}
