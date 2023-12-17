import { Request, Response } from 'express'
import { ServiceList } from '../app.js'

export default function handlerFactory(services: ServiceList) {
  return async (_: Request, res: Response) => {
    const sounds = await services.sound.findAll()
    res.json({ data: sounds.map((sound) => sound?.toObject()) })
  }
}
