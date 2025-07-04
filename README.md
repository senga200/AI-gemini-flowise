# 🧠 Agent IA + API Express + Docker

Ce projet est une petite interface web utilisant **Node.js + Express** pour exposer une API alimentée par un agent IA. On peut de faire des requêtes textuelles ou avec image, ainsi que des agents spécialisés (films, quiz musical).

Le code est construit par bloc pour bien séparer les différentes fonctionnalités.

---

## 🚀 Fonctionnalités

- 📤 Envoi de requêtes texte ou image à un modèle IA Gemini
- 🎬 Recommandation dynamique de films selon un genre à un agent Flowise avec Mistral
- 🎵 Générateur de quiz musical à un agent Flowise avec Mistral
- 🐳 agent conteneurisé avec **Docker** https://docs.flowiseai.com/getting-started
- ☁️ Déploiement sur un **VPS OVH**

---

## 📦 Stack technique

- Frontend : HTML / CSS / JavaScript Vanilla
- Backend : Node.js + Express
- IA : via API (Flowise et Mistral pour l'agent, et Gemini, selon config)
- Docker : pour l’agent IA ou les services associés

---


Toujours en phase de test, et loin d'être fini, mais visible sur :
http://vps-1b9fc044.vps.ovh.net:3001/