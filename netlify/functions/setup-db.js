import { neon } from '@netlify/neon';

export default async () => {
  const sql = neon();

  await sql`
    CREATE TABLE IF NOT EXISTS highscores (
      id SERIAL PRIMARY KEY,
      player_name TEXT NOT NULL,
      score INTEGER NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  return new Response(
    JSON.stringify({ message: "Database table 'highscores' is ready." }),
    { status: 200 }
  );
};

export const config = {
  path: "/api/setup-db",
};