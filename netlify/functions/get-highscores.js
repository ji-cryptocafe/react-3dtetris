import { neon } from '@netlify/neon';

export default async () => {
  try {
    const sql = neon();
    const highscores = await sql`
      SELECT player_name, score 
      FROM highscores 
      ORDER BY score DESC 
      LIMIT 10;
    `;
    return new Response(JSON.stringify(highscores), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Failed to fetch highscores." }), { status: 500 });
  }
};

export const config = {
  path: "/api/get-highscores",
};