import { z } from 'zod'

const playlistIdRegex = /^[A-Za-z0-9_-]{10,50}$/

export const playlistIdSchema = z.string().regex(playlistIdRegex)

export const ytApiKeySchema = z.string().trim().nonempty()
