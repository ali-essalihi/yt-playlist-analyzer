import ky from 'ky'

export const api = ky.create({
  timeout: false,
  retry: {
    limit: 0,
    afterStatusCodes: [],
  },
})
