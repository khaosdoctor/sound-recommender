import { Request, Response } from 'express'
import { ServiceList } from '../app.js'

export default function handlerFactory(services: ServiceList) {
  return async (req: Request<never, never, never, { playlistId: string }>, res: Response) => {
    const { playlistId } = req.query
    const playlist = await services.playlist.findById(playlistId)

    const recommendations = await services.sound.getRecommendationByPlaylist(playlist)
    res.json({ data: recommendations.map((r) => r.sound.toObject()) })
  }
}
