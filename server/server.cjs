const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database.cjs');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Login / Register
app.post('/api/login', (req, res) => {
    const { name, school, grade } = req.body;
    // Simple "login": if exists return, else create.
    // We use name + school + grade as a pseudo-unique key for simplicity in this demo,
    // or regenerate ID. To keep it stable, let's generate a deterministic ID or just a random one.
    // For this demo, let's validte input and create a new ID if not sent, 
    // but actually we can just query by name/school/grade or create.

    // Checking if user exists with same metadata
    const sqlCheck = `SELECT * FROM students WHERE name = ? AND school = ? AND grade = ?`;
    db.get(sqlCheck, [name, school, grade], (err, row) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (row) {
            res.json(row);
        } else {
            const id = Date.now().toString(); // Simple ID generation
            const sqlInsert = `INSERT INTO students (id, name, school, grade) VALUES (?, ?, ?, ?)`;
            db.run(sqlInsert, [id, name, school, grade], function (err) {
                if (err) {
                    res.status(400).json({ error: err.message });
                    return;
                }
                res.json({ id, name, school, grade });
            });
        }
    });
});

// Get Projects for Student
app.get('/api/projects/:studentId', (req, res) => {
    const { studentId } = req.params;
    const sql = `SELECT * FROM projects WHERE student_id = ? ORDER BY created_at DESC`;
    db.all(sql, [studentId], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get Single Project (Load Workspace)
app.get('/api/project/:id', (req, res) => {
    const { id } = req.params;
    const sql = `SELECT * FROM projects WHERE id = ?`;
    db.get(sql, [id], (err, row) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: "Project not found" });
            return;
        }
        res.json(row);
    });
});

// Create Project
app.post('/api/projects', (req, res) => {
    const { student_id, title, description, type } = req.body;
    const id = Date.now().toString();
    const created_at = new Date().toISOString();

    // Default content for empty project
    const content = JSON.stringify({ nodes: [], edges: [], log: "" });

    const sql = `INSERT INTO projects (id, student_id, title, description, type, created_at, content) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [id, student_id, title, description, type, created_at, content], function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ id, student_id, title, description, type, created_at, content });
    });
});

// Save Project (Update Content)
app.put('/api/projects/:id', (req, res) => {
    const { id } = req.params;
    const { content } = req.body; // Expects JSON string or object

    // If content is object, stringify it
    const contentStr = typeof content === 'object' ? JSON.stringify(content) : content;

    const sql = `UPDATE projects SET content = ? WHERE id = ?`;
    db.run(sql, [contentStr, id], function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: "Project updated successfully", changes: this.changes });
    });
});

// Create/Save Dataset
app.post('/api/datasets', (req, res) => {
    const { owner_id, name, type, content, is_public } = req.body;
    const id = Date.now().toString();
    const created_at = new Date().toISOString();

    const contentStr = typeof content === 'object' ? JSON.stringify(content) : content;

    const sql = `INSERT INTO datasets (id, owner_id, name, type, content, is_public, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [id, owner_id, name, type, contentStr, is_public ? 1 : 0, created_at], function (err) {
        if (err) {
            console.error(err);
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ id, owner_id, name, type, is_public, created_at });
    });
});

// Get Datasets (Public + Owned by User)
app.get('/api/datasets', (req, res) => {
    const { studentId } = req.query; // Optional: if provided, we get owned + public. If not, just public? Or enforce login.

    let sql = `SELECT * FROM datasets WHERE is_public = 1`;
    let params = [];

    if (studentId) {
        sql += ` OR owner_id = ?`;
        params.push(studentId);
    }

    sql += ` ORDER BY created_at DESC`;

    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        // Parse content back to JSON if needed, or send as string. 
        // For list view, maybe we don't need content? But user might want to load it eventually.
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
