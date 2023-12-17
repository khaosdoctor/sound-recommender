import { Router } from 'express'
import { ServiceList } from '../app.js'
import addPlaylistHandler from './addPlaylist.js'
import addSoundHandler from './addSound.js'
import getRecommendationHandler from './getRecommendation.js'
import listSoundsHandler from './listSounds.js'
import getSoundHandler from './getSound.js'
import listPlaylistsHandler from './listPlaylists.js'

export function loadRoutes(services: ServiceList) {
  const router = Router()

  router.get('/sounds', listSoundsHandler(services))
  router.get('/sounds/recommended', getRecommendationHandler(services))
  router.get('/sounds/:id', getSoundHandler(services))
  router.post('/admin/sounds', addSoundHandler(services))
  router.get('/playlists', listPlaylistsHandler(services))
  router.post('/playlists', addPlaylistHandler(services))
  router.get('/ping', (_, res) => res.send('pong'))
  return router
}
