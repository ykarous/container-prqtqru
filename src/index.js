const express = require("express");
const os = require("os");
const fs = require("fs"); // Pour le test disque
const app = express();
const port = 5000;

const mysql = require('mysql2');

// Configuration DB (inchangée)
const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = process.env;

app.get("/", (req, res) => {
    // 1. Calcul de la RAM
    const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
    const usedMem = (totalMem - freeMem).toFixed(2);

    // 2. Infos CPU
    const cpus = os.cpus();
    const cpuModel = cpus[0].model;
    const cpuCount = cpus.length;

    // 3. Test de vitesse disque (Écriture d'un petit fichier de 10Mo)
    const testFileName = "test_speed.tmp";
    const data = Buffer.alloc(10 * 1024 * 1024, 'a'); // 10 Mo
    const start = Date.now();
    try {
        fs.writeFileSync(testFileName, data);
        const end = Date.now();
        const duration = (end - start) / 1000; // secondes
        const speed = (10 / duration).toFixed(2);
        fs.unlinkSync(testFileName); // Supprime le fichier test

        var diskResult = `${speed} MB/s`;
    } catch (e) {
        var diskResult = "Erreur (Droits d'écriture restreints)";
    }

    // Mise en forme HTML
    let html = `
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0e1117; color: #e6edf3; padding: 40px; line-height: 1.6;">
            <h1 style="color: #58a6ff; border-bottom: 1px solid #30363d; padding-bottom: 10px;">📊 Dashboard Serveur Production</h1>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                <div style="background: #161b22; padding: 20px; border-radius: 8px; border: 1px solid #30363d;">
                    <h2 style="color: #7d8590; font-size: 14px; text-transform: uppercase;">Processeur</h2>
                    <p style="font-size: 18px; font-weight: bold;">${cpuModel}</p>
                    <p>Cœurs : <span style="color: #f0883e;">${cpuCount}</span></p>
                </div>
                
                <div style="background: #161b22; padding: 20px; border-radius: 8px; border: 1px solid #30363d;">
                    <h2 style="color: #7d8590; font-size: 14px; text-transform: uppercase;">Mémoire vive (RAM)</h2>
                    <p style="font-size: 24px; font-weight: bold; color: #3fb950;">${usedMem} / ${totalMem} GB</p>
                    <div style="background: #30363d; height: 10px; border-radius: 5px;">
                        <div style="background: #3fb950; width: ${(usedMem/totalMem*100).toFixed(0)}%; height: 100%; border-radius: 5px;"></div>
                    </div>
                </div>

                <div style="background: #161b22; padding: 20px; border-radius: 8px; border: 1px solid #30363d;">
                    <h2 style="color: #7d8590; font-size: 14px; text-transform: uppercase;">Vitesse Écriture Disque</h2>
                    <p style="font-size: 24px; font-weight: bold; color: #d2a8ff;">${diskResult}</p>
                </div>

                <div style="background: #161b22; padding: 20px; border-radius: 8px; border: 1px solid #30363d;">
                    <h2 style="color: #7d8590; font-size: 14px; text-transform: uppercase;">Système</h2>
                    <p><strong>OS:</strong> ${os.type()} ${os.arch()}</p>
                    <p><strong>Uptime:</strong> ${(os.uptime() / 3600).toFixed(1)} heures</p>
                </div>
            </div>

            <p style="margin-top: 30px; text-align: center;">
                <a href="/health" style="background: #238636; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">Vérifier Database</a>
            </p>
        </body>
    `;
    res.send(html);
})

// Route /health inchangée
app.get("/health", (req, res) => {
    const connection = mysql.createConnection({
        host: DB_HOST, port: DB_PORT, user: DB_USER, database: DB_NAME, password: DB_PASSWORD,
    });
    connection.query('SELECT NOW() AS now', (err) => {
        if (err) res.status(500).send("DB ERROR");
        else res.send("DB OK");
        connection.end();
    });
})

app.listen(port, () => console.log(`Serveur prêt sur port ${port}`));
