import { Request, Response } from 'express'
import { ServiceList } from '../app.js'

export default function handlerFactory(services: ServiceList) {
  return async (req: Request<{ id: string }>, res: Response) => {
    const sound = await services.sound.findById(req.params.id)
    return res.json({ data: sound.toObject() })
  }
}
