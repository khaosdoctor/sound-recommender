import { Request, Response } from 'express'
import { ServiceList } from '../app.js'

export default function handlerFactory(services: ServiceList) {
  return async (req: Request<never, never, never, { playlistId: string }>, res: Response) => {
    const { playlistId } = req.query
    if (!playlistId) {
      res.status(422).json({ error: 'Missing playlistId' })
      return
    }
    const playlist = await services.playlist.findById(playlistId)

    const recommendations = await services.sound.getRecommendationByPlaylist(playlist)
    res.json({ data: recommendations.map((r) => r.sound.toObject()) })
  }
}
