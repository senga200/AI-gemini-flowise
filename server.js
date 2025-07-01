import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
// Servir les fichiers statiques dans "public"
app.use(express.static(path.join(__dirname, 'public')));

// Route principale
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});



//////////////GEMINI API////////////////////

app.post('/api/gemini', async (req, res) => {
  try {
    const requestBody = req.body; // récupère le Json du front
    console.log('Requête reçue:', requestBody);

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody), // transmet le Json à gemini
      }
    );

    const data = await geminiRes.json();
    res.json(data); // renvoie la resp gemini au front
  } catch (error) {
    console.error('Erreur Gemini:', error);
    res.status(500).json({ error: 'Erreur serveur avec Gemini' });
  }
});

//////////// Agent flowise ///////////////

// AGENT FILM

app.post("/api/agent-film", async (req, res) => {
  try {
    const { messages, genre } = req.body;
    const prompt = messages?.[0]?.content;
      // Intégrer le genre directement dans le message
    const enhancedPrompt = `${prompt} (Genre: ${genre})`;
    console.log("Prompt modifié:", enhancedPrompt);
  const bodyToSend = {
      question: enhancedPrompt, // ou message ? faut il supprimer input ? 
    };

    console.log("Requete recue - prompt:", prompt);
    console.log("Requete recue - genre:", genre);


    console.log("Body envoyé à Flowise:", JSON.stringify(bodyToSend, null, 2));

  const response = await fetch(`http://localhost:3000/api/v1/prediction/b8b4bc28-5a60-43c1-82c4-aad3c8158f28`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.FLOWISE}`,
      },
      body: JSON.stringify(bodyToSend),
    });

    const text = await response.text();
    console.log("Réponse brute Flowise:", text);

    if (!response.ok) {
      return res.status(response.status).json({ error: "Erreur flowise film : " + response.statusText, details: text });
    }

    const data = JSON.parse(text);
    res.json(data);

  } catch (error) {
    console.error("Erreur backend FLOWISE film:", error.stack || error);
    res.status(500).json({ error: "Erreur serveur backend FLOWISE film" });
  }
});

// AGENT MUSIQUE
app.post("/api/agent-musique", async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log("Requête LettA musique:", prompt);
    const response = await fetch(`https://api.letta.com/v1/agents/${process.env.LETTA_AGENT_MUSIQUE}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LETTA_API_KEY}`,
      },
      body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Erreur LettA musique : " + response.statusText });
    }

    const data = await response.json();
    res.json(data);
    console.log("Réponse LettA musique:", data);
  } catch (error) {
    console.error("Erreur backend LettA musique:", error);
    res.status(500).json({ error: "Erreur serveur backend LettA musique" });
  }
});


const PORT = process.env.PORT || 3001;






app.listen(PORT, '0.0.0.0', () => console.log(`server ecoute sur http://0.0.0.0:${PORT}`));







