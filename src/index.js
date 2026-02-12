const express = require("express");
const os = require("os");
const fs = require("fs");
const { execSync } = require("child_process");
const mysql = require('mysql2');

const app = express();
const port = 5000;

// Récupération des variables d'environnement pour la DB
const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = process.env;

app.get("/", (req, res) => {
    // 1. Infos CPU
    const cpus = os.cpus();
    const cpuModel = cpus[0].model;
    const cpuCount = cpus.length;

    // 2. Infos RAM
    const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
    const usedMem = (totalMem - freeMem).toFixed(2);
    const ramPercent = ((usedMem / totalMem) * 100).toFixed(0);

    // 3. Infos STOCKAGE (Espace Disque)
    let diskSpace = { total: "N/A", used: "N/A", percent: "0" };
    try {
        // Commande pour récupérer Taille, Utilisé, et % sur la racine /
        const df = execSync("df -h / --output=size,used,pcent | tail -1").toString().trim().split(/\s+/);
        diskSpace.total = df[0];
        diskSpace.used = df[1];
        diskSpace.percent = df[2].replace('%', '');
    } catch (e) {
        console.error("Erreur disque:", e);
    }

    // 4. Test de vitesse d'écriture
    const testFileName = "bench_test.tmp";
    const data = Buffer.alloc(10 * 1024 * 1024, 'a'); // Fichier de 10 Mo
    const start = Date.now();
    let diskSpeed = "0";
    try {
        fs.writeFileSync(testFileName, data);
        const duration = (Date.now() - start) / 1000;
        diskSpeed = (10 / duration).toFixed(2);
        fs.unlinkSync(testFileName);
    } catch (e) { diskSpeed = "Erreur (lecture seule ?)"; }

    // 5. Rendu HTML
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Dashboard Serveur</title>
        <style>
            body { font-family: 'Segoe UI', sans-serif; background: #0d1117; color: #c9d1d9; padding: 20px; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
            .card { background: #161b22; border: 1px solid #30363d; border-radius: 10px; padding: 20px; }
            .label { color: #8b949e; font-size: 12px; text-transform: uppercase; margin-bottom: 10px; }
            .value { font-size: 22px; font-weight: bold; margin: 5px 0; }
            .bar-bg { background: #30363d; height: 8px; border-radius: 4px; margin-top: 10px; }
            .bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s; }
            .cpu-color { background: #58a6ff; }
            .ram-color { background: #3fb950; }
            .disk-color { background: #f0883e; }
            .speed-color { background: #d2a8ff; }
            .btn { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #238636; color: white; text-decoration: none; border-radius: 6px; }
        </style>
    </head>
    <body>
        <h1 style="color: #58a6ff;">🚀 Dashboard Serveur Production</h1>
        <p>Uptime Système: <strong>${(os.uptime() / 3600).toFixed(1)} heures</strong></p>
        
        <div class="grid">
            <div class="card">
                <div class="label">Processeur (CPU)</div>
                <div class="value">${cpuModel}</div>
                <div>${cpuCount} cœurs logiques</div>
            </div>

            <div class="card">
                <div class="label">Mémoire Vive (RAM)</div>
                <div class="value">${usedMem} / ${totalMem} GB</div>
                <div class="bar-bg"><div class="bar-fill ram-color" style="width: ${ramPercent}%"></div></div>
                <small>${ramPercent}% utilisé</small>
            </div>

            <div class="card">
                <div class="label">Stockage Disque (Partition /)</div>
                <div class="value">${diskSpace.used} / ${diskSpace.total}</div>
                <div class="bar-bg"><div class="bar-fill disk-color" style="width: ${diskSpace.percent}%"></div></div>
                <small>${diskSpace.percent}% utilisé</small>
            </div>

            <div class="card">
                <div class="label">Vitesse Écriture Disque</div>
                <div class="value" style="color: #d2a8ff;">${diskSpeed} MB/s</div>
                <div>Test sur un bloc de 10 Mo</div>
            </div>
        </div>

        <center><a href="/health" class="btn">Tester Connexion Database</a></center>
    </body>
    </html>
    `;
    res.send(html);
});

// Route Healthcheck pour la base de données
app.get("/health", (req, res) => {
    const connection = mysql.createConnection({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        database: DB_NAME,
        password: DB_PASSWORD,
    });

    connection.query('SELECT NOW() AS now', (err) => {
        if (err) {
            console.error(err);
            res.status(500).send("<h1>❌ Erreur Database</h1><p>" + err.message + "</p>");
        } else {
            res.send("<h1>✅ Database Connectée</h1><p>Le serveur répond correctement.</p>");
        }
        connection.end();
    });
});

app.listen(port, () => {
    console.log(`Serveur de monitoring lancé sur http://localhost:${port}`);
});
