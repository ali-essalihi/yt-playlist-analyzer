import Database from 'better-sqlite3'

const isTest = process.env.NODE_ENV === 'test'
const isDev = process.env.NODE_ENV === 'development'

const db = new Database(isTest ? ':memory:' : 'app.db', {
  verbose: isDev ? console.log : undefined,
})

export { db }
