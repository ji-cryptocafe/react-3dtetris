import { neon } from '@netlify/neon';

// highlight-start
export default async (req) => {
// highlight-end
  try {
    const { playerName, score } = await req.json();

    // Basic validation
    if (!playerName || typeof playerName !== 'string' || playerName.length > 20) {
      return new Response(JSON.stringify({ message: "Invalid player name." }), { status: 400 });
    }
    if (!score || typeof score !== 'number' || score < 0) {
      return new Response(JSON.stringify({ message: "Invalid score." }), { status: 400 });
    }

    const sql = neon();
    await sql`
      INSERT INTO highscores (player_name, score) 
      VALUES (${playerName}, ${score});
    `;

    return new Response(JSON.stringify({ message: "Highscore submitted successfully." }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Failed to submit highscore." }), { status: 500 });
  }
};

export const config = {
  path: "/api/submit-highscore",
};