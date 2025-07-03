
let API_BASE_URL = "";

async function initAPIBaseURL() {
  const configRoute = window.location.hostname === "localhost" ? "/api/config-local" : "/api/config";

  try {
    const res = await fetch(configRoute);
    const data = await res.json();
    API_BASE_URL = data.ip;
    console.log("✅ API_BASE_URL défini à :", API_BASE_URL);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de l'IP : ", error);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await initAPIBaseURL(); // Appel dès que la page est prête
});

// blocage des requêtes trop fréquentes
// Limite à 5 requêtes par heure
// Utilise localStorage pour stocker les timestamps des requêtes (à optimiser)
// Nettoie les timestamps plus vieux d'une heure
function canMakeRequest() {
  const maxRequests = 5;
  const intervalMs = 60 * 60 * 1000; // 1 heure

  // recup les timestamps stockés, ou tableau vide
  let timestamps = JSON.parse(localStorage.getItem("requestTimestamps") || "[]");

  // Nettoie les timestamps > 1h (+ vieux)
  const now = Date.now();
  timestamps = timestamps.filter(ts => now - ts < intervalMs);

  if (timestamps.length >= maxRequests) {
    return false; 
  }

  // Sinon, ajoute le timestamp courant et stocke
  timestamps.push(now);
  localStorage.setItem("requestTimestamps", JSON.stringify(timestamps));
  return true;
}


// --------------- BLOC 1 : TEXTE ------------------
const submitButtonText = document.getElementById("submitBtnText");
const inputText = document.getElementById("promptText");
const resultText = document.querySelector(".text-result");

submitButtonText.addEventListener("click", async (e) => {
    e.preventDefault();
      if (!API_BASE_URL) {
    await initAPIBaseURL(); // attendre la récup de l url
  }
    if (!canMakeRequest()) {
  alert("Trop de requêtes effectuées. Veuillez réessayer plus tard.");
  return; 
}

    resultText.innerHTML = "Recherche en cours...";
    let inputValue = inputText.value;

    try {
        let response = await fetch(`${API_BASE_URL}/api/gemini`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ 
                    role: "user", 
                    parts: [{ text: inputValue }] }]
            }),
        });

        if (!response.ok) {
            throw new Error("erreur API", response.statusText);
        }

        let data = await response.json();
        console.log("data", data);
        resultText.innerHTML = data.candidates?.[0]?.content?.parts?.[0]?.text || "Erreur.";
        console.log("data.candidates", data.candidates);
        console.log("data.candidates.content.parts.text", data.candidates?.[0]?.content?.parts?.[0]?.text);
    } catch (error) {
        console.log("erreur", error);
        resultText.innerHTML = "Erreur attrapée dans le bloc texte.";
    }
});

// --------------- BLOC 2 : IMAGE + TEXTE ------------------
const submitButton = document.getElementById("submitBtn");
const input = document.getElementById("prompt");
const result = document.querySelector(".result");
const fileInput = document.getElementById("chosenImage");

submitButton.addEventListener("click", async (e) => {
    e.preventDefault();
    if (!API_BASE_URL) {
    await initAPIBaseURL(); // attendre la récup de l url
  }
        if (!canMakeRequest()) {
  alert("Trop de requêtes effectuées. Veuillez réessayer plus tard.");
  return; 
}

    result.innerHTML = "Recherche en cours...";
    let inputValue = input.value;
    let file = fileInput.files[0];

    if (!file) {
        result.innerHTML = "Aucun fichier sélectionné.";
        return;
    }
    

    let reader = new FileReader();
//split pour recuperer après la virgule : data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD etc...
         //avant la virgule c'est le type de l'image
    reader.onload = async () => {
        try {
            let image = reader.result;
            let imageBase64 = image.split(",")[1];

            let response = await fetch(`${API_BASE_URL}/api/gemini`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        role: "user",
                        parts: [
                            { inline_data: { mime_type: "image/jpeg", data: imageBase64 } },
                            { text: inputValue }
                        ]
                    }]
                }),
            });

            if (!response.ok) {
                throw new Error("erreur API", response.statusText);
            }

            let data = await response.json();
            result.innerHTML = data.candidates?.[0]?.content?.parts?.[0]?.text || "Erreur.";
        } catch (error) {
            console.log("erreur", error);
            result.innerHTML = "Erreur attrapée dans le bloc image.";
        }
    };
// Lire le fichier et le convertir
    reader.readAsDataURL(file);
});

// --------------- BLOC 3 : AGENT PROPOSITION FILM------------------
const propositionButtonsFilm = document.querySelectorAll(".propositionFilm");
const resultAgentFilm = document.querySelector(".agent-result-film");

propositionButtonsFilm.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
        e.preventDefault();
        if (!API_BASE_URL) {
        await initAPIBaseURL(); // attendre la récup de l url
        }
        if (!canMakeRequest()) {
        alert("Trop de requêtes effectuées. Veuillez réessayer plus tard");
        return; 
        }
        // Enlever la sélection précédente
        for (const btn of propositionButtonsFilm) {
            btn.classList.remove("selected");
        }

        // Marquer le bouton comme sélectionné
        btn.classList.add("selected");
        resultAgentFilm.innerHTML = "Génération d'idée de film en cours...";


        const genreLabel = btn.innerText.trim().toLowerCase();
        const genre = genreLabel;

        //const genre = btn.innerText.trim().toLowerCase();
        // le prompt est maintenant dans flowise
//         const prompt = `
// Tu es un assistant virtuel spécialisé dans la recommandation de films. Ta mission est de me proposer **une suggestion de film pertinente et variée** à regarder en fonction du genre que je t'indique. **Essaie d'éviter de répéter les mêmes suggestions ou de choisir systématiquement les films les plus populaires ou les plus évidents du genre demandé.**

// Quand je te demande :
//     "Propose-moi un film ${genre}."

// Tu dois **impérativement** répondre **UNIQUEMENT** avec le JSON suivant, sans aucune phrase d'introduction, d'explication ou de conclusion :
// {
//     "film": "Titre du film",                 
//     "genre": "${genre}",                     
//     "année": "Année de sortie",             
//     "synopsis": "Un court résumé pertinent."
// }

// **Important :** La clé pour varier les suggestions est de ne pas toujours choisir le film le plus connu pour le genre ${genre}. Explore des options peut-être un peu moins courantes mais toujours représentatives et de qualité.

// Maintenant, exécute la tâche : propose-moi un film ${genre} en respectant **strictement** ce format JSON et les instructions de variété.
//         `;

        try {
            const response = await fetch(`${API_BASE_URL}/api/agent-film`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                     //"Authorization": `Bearer etc`,
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: "user",
                           // content: prompt
                            //content: `Propose-moi un film ${genre}.`
                        }
                    ],
                    genre: genre,
                }),
            });

            if (!response.ok) throw new Error("Erreur API : " + response.statusText);

            const data = await response.json();
            console.log("Réponse brute :", data);

           // let resultText = data?.messages?.[1]?.content || "";
           let resultText = data?.text || "";
            console.log("Texte brut :", resultText);

            resultText = resultText.replace(/```json|```/g, "").trim();

            const movie = JSON.parse(resultText);

            resultAgentFilm.innerHTML = `
                <strong>Film :</strong> ${movie.film} <br>
                <strong>Genre :</strong> ${movie.genre} <br>
                <strong>Année :</strong> ${movie.année} <br>
                <strong>Synopsis :</strong> ${movie.synopsis}
            `;
            resultAgentFilm.style.display = "block";
        } catch (error) {
            console.error("Erreur backend FLOWISE film:", error.stack || error);
            resultAgentFilm.innerHTML = "❌ Une erreur est survenue lors de la génération.";
            resultAgentFilm.style.display = "block";
        }
    });
});




// --------------- BLOC 4 : AGENT QUIZZ MUSIQUE ------------------
const submitButtonAgent = document.getElementById("submitBtnAgent");
const resultAgent = document.querySelector(".agent-result");
const generatedQuestionElement = document.getElementById("questionGenerator");
const propositionButtons = document.querySelectorAll(".proposition");

submitButtonAgent.addEventListener("click", async (e) => {
    e.preventDefault();
    if (!API_BASE_URL) {
    await initAPIBaseURL(); // attendre la récup de l url
  }
    if (!canMakeRequest()) {
    alert("Trop de requêtes effectuées. Veuillez réessayer plus tard.");
    return; 
}

    resultAgent.style.display = "none";
    resultAgent.innerHTML = "";
    propositionButtons.forEach((btn) => {
        btn.style.display = "none";
        btn.textContent = "";
    });

    generatedQuestionElement.innerHTML = "🎵 Génération de la question musicale en cours...🎵";
    generatedQuestionElement.style.display = "block";

    // le prompt est maintenant dans flowise 🥳
    // const prompt = `
    // Tu es un générateur de questions de quiz musical, spécialisé dans la musique française et anglo-saxonne entre 1970 et 2000.

    // Ta mission est de générer UNE SEULE question originale de type Trivial Pursuit, avec 4 propositions (A, B, C, D), dont une seule est correcte.

    // Voici des exemples de ce qu'on attend de toi :

    // Si je te demande :
    // "Qui a sorti l'album 'Thriller' en 1982 ?"
    
    // Tu me réponds :
    // {
    // "question": "Qui a sorti l'album 'Thriller' en 1982 ?",
    // "propositions": ["Prince", "Michael Jackson", "Stevie Wonder", "Madonna"],
    // "bonneReponse": "Michael Jackson"
    // }
    
    // Si je te demande :
    // "Quel groupe a chanté 'Bohemian Rhapsody' ?"
    
    // Tu me réponds :
    // {
    // "question": "Quel groupe a chanté 'Bohemian Rhapsody' ?",
    // "propositions": ["Queen", "Pink Floyd", "The Beatles", "Led Zeppelin"],
    // "bonneReponse": "Queen"
    // }
    
    // Si je te demande :
    // "Quelle chanteuse française a interprété 'Joe le taxi' ?"
    
    // Tu me réponds :
    // {
    // "question": "Quelle chanteuse française a interprété 'Joe le taxi' ?",
    // "propositions": ["France Gall", "Mylène Farmer", "Vanessa Paradis", "Patricia Kaas"],
    // "bonneReponse": "Vanessa Paradis"
    // }

    // Maintenant, génère UNE NOUVELLE question originale dans le même style, avec le même format JSON STRICTEMENT, sans ajouter de commentaires ni de texte hors du JSON.
    // `;

    try {
        const response = await fetch(`${API_BASE_URL}/api/agent-musique`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        messages:[{ 
            role: "user", 
            //content: prompt 
            }],
        propositions: ["A", "B", "C", "D"]
        }),
});

if (!response.ok) throw new Error("Erreur API : " + response.statusText);
const quiz = await response.json();

generatedQuestionElement.innerHTML = quiz.question;

propositionButtons.forEach((btn, index) => {
  btn.textContent = quiz.propositions[index];
  btn.style.display = "inline-block";

  btn.onclick = () => {
    if (quiz.propositions[index] === quiz.bonneReponse) {
      resultAgent.innerHTML = "✅ Bonne réponse !";
      resultAgent.style.color = "green";
    } else {
      resultAgent.innerHTML = `❌ Mauvaise réponse.`;
      resultAgent.style.color = "red";
    }
    resultAgent.style.display = "block";
   // console.log(`La bonne réponse est : ${quiz.bonneReponse}`);
  };
});

    } catch (error) {
        console.error("Erreur attrapée :", error);
        resultAgent.innerHTML = "❌ Une erreur est survenue lors de la génération.";
        resultAgent.style.display = "block";
    }
});