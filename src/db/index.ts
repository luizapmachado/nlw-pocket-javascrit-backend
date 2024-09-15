import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
//importar tudo que for criado no arquivo schema.ts
import * as schema from './schema'
import { env } from '../env'

export const client = postgres(env.DATABASE_URL)
export const db = drizzle(client, { schema, logger: true })
