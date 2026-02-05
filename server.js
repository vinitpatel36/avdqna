import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;
const STATE_FILE = path.join(__dirname, 'gameState.json');

app.use(cors());
app.use(express.json());

// Initialize state file if not exists
const INITIAL_STATE = {
    status: 'LOBBY',
    question: '',
    questionQueue: [],
    participants: []
};

if (!fs.existsSync(STATE_FILE)) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(INITIAL_STATE, null, 2));
}

// GET State
app.get('/api/state', (req, res) => {
    try {
        const data = fs.readFileSync(STATE_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: 'Failed to read state' });
    }
});

// POST State
app.post('/api/state', (req, res) => {
    try {
        const newState = req.body;
        fs.writeFileSync(STATE_FILE, JSON.stringify(newState, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save state' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
