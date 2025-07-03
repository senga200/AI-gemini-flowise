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

// VPS 
app.get('/api/config', (req, res) => {
  res.json({ ip: process.env.IP_VPS });
});

// localhost en local
app.get('/api/config-local', (req, res) => {
  res.json({ ip: process.env.IP_LOCAL });
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
const FLOWCHART_FILM_ID = process.env.FLOWISE_FLOWCHART_FILM_ID;
app.post("/api/agent-film", async (req, res) => {
  try {
const { messages, genre } = req.body;
    const prompt = messages?.[0]?.content;
      // Intégrer le genre directement dans le message
    const enhancedPrompt = `${prompt} (Genre: ${genre})`;
    console.log("Prompt modifié:", enhancedPrompt); 
  const bodyToSend = {
 question: enhancedPrompt, 
    };
    
    console.log("Requete recue - prompt:", prompt);
    console.log("Requete recue - genre:", genre);
    console.log("Body envoyé à Flowise:", JSON.stringify(bodyToSend, null, 2));

  const response = await fetch(`http://localhost:3000/api/v1/prediction/${FLOWCHART_FILM_ID}`, {
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
const FLOWCHART_MUSIQUE_ID = process.env.FLOWISE_FLOWCHART_MUSIQUE_ID;
app.post("/api/agent-musique", async (req, res) => {
  try {
    const {propositions} = req.body;
    if (!propositions) {
      return res.status(400).json({ error: "Données invalides : prompt ou propositions manquants" });
    }
    console.log("propositions", propositions);
    const bodyToSend = {
      propositions,
    };
    console.log("Body envoyé à Flowise musique:", JSON.stringify(bodyToSend, null, 2));

    const response = await fetch(`http://localhost:3000/api/v1/prediction/${FLOWCHART_MUSIQUE_ID}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.FLOWISE}`,
      },
      body: JSON.stringify(bodyToSend),
    });

    const text = await response.text();
    console.log("Réponse brute Flowise musique:", text);

    if (!response.ok) {
      return res.status(response.status).json({ error: `Erreur Flowise: ${response.statusText}` });
    }

    // Premier parse JSON
    const data = JSON.parse(text);
    console.log("Données JSON reçues parse 1:", data);

    // Puis parse la chaîne JSON dans data.text
    let quizData;
    try {
      quizData = JSON.parse(data.text);
    } catch (err) {
      console.error("Erreur de parsing JSON imbriqué dans data.text:", err);
      return res.status(500).json({ error: "Erreur de parsing JSON imbriqué", details: err.message });
    }
    console.log("Données JSON reçues parse 2:", quizData);
    res.json(quizData);

  } catch (error) {
    console.error("Erreur backend musique:", error);
    res.status(500).json({ error: "Erreur serveur backend musique", details: error.message });
  }
});


///////////////////////////////////////////
const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => console.log(`server ecoute sur http://0.0.0.0:${PORT}`));







