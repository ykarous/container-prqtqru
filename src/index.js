const express = require("express")
const os = require("os") // Ajout du module OS
const app = express()
const port = 5000

const mysql = require('mysql2')

// Configuration DB
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_NAME = process.env.DB_NAME;

// --- NOUVELLE ROUTE DE PERFORMANCE ---
app.get("/", (req, res) => {
    // Calcul de la RAM
    const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
    const usedMem = (totalMem - freeMem).toFixed(2);

    // Infos CPU
    const cpus = os.cpus();
    const cpuModel = cpus[0].model;
    const cpuCount = cpus.length;

    // Mise en forme HTML pour la lisibilité
    let html = `
        <body style="font-family: sans-serif; background: #121212; color: #00ff00; padding: 20px;">
            <h1>🚀 Performance du Serveur</h1>
            <hr>
            <h3>🖥️ Matériel</h3>
            <ul>
                <li><strong>OS:</strong> ${os.type()} ${os.release()} (${os.arch()})</li>
                <li><strong>CPU:</strong> ${cpuModel}</li>
                <li><strong>Cœurs:</strong> ${cpuCount}</li>
                <li><strong>RAM Totale:</strong> ${totalMem} GB</li>
                <li><strong>RAM Utilisée:</strong> ${usedMem} GB</li>
            </ul>
            <h3>⏱️ Temps d'activité (Uptime)</h3>
            <ul>
                <li><strong>Système:</strong> ${(os.uptime() / 3600).toFixed(2)} heures</li>
                <li><strong>Application:</strong> ${(process.uptime() / 60).toFixed(2)} minutes</li>
            </ul>
            <hr>
            <p><a href="/health" style="color: #00ccff;">Vérifier la base de données (Healthcheck)</a></p>
        </body>
    `;
    res.send(html);
})

// Garde ta route health intacte
app.get("/health", (req, res) => {
    const connection = mysql.createConnection({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        database: DB_NAME,
        password: DB_PASSWORD,
    });

    connection.query('SELECT NOW() AS now', (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send("BAD");
        } else {
            res.send("OK");
        }
        connection.end(); // Important de fermer la connexion
    });
})

app.listen(port, () => {
    console.log(`Serveur de monitoring sur le port ${port}`)
})
