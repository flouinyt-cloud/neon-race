const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();

app.use(cors());
app.use(express.json());

const USERS_FILE = './users.json';
const ITEMS_FILE = './items.json';
const CHATS_FILE = './chats.json';

const read = (f) => fs.existsSync(f) ? JSON.parse(fs.readFileSync(f)) : [];
const write = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2));

// Твой ник для полного доступа
const ADMIN_NICKNAME = 'Admin';

// --- АВТОРИЗАЦИЯ ---
app.post('/api/register', (req, res) => {
    const users = read(USERS_FILE);
    if(users.find(u => u.user === req.body.user)) return res.status(400).json({error: "Ник занят"});
    users.push(req.body);
    write(USERS_FILE, users);
    res.json({ok: true});
});

app.post('/api/login', (req, res) => {
    const users = read(USERS_FILE);
    const user = users.find(u => u.user === req.body.user && u.pass === req.body.pass);
    if(!user) return res.status(400).json({error: "Неверный логин или пароль"});
    res.json({ok: true});
});

// --- ТОВАРЫ ---
app.get('/api/items', (req, res) => res.json(read(ITEMS_FILE)));

app.post('/api/sell', (req, res) => {
    const items = read(ITEMS_FILE);
    const newItem = {
        id: Date.now(), // Уникальный ID для удаления
        name: req.body.name,
        price: req.body.price,
        seller: req.body.seller
    };
    items.push(newItem);
    write(ITEMS_FILE, items);
    res.json({ok: true});
});

app.delete('/api/items/:id', (req, res) => {
    const { user } = req.body;
    let items = read(ITEMS_FILE);
    const item = items.find(i => i.id == req.params.id);

    if (item && (item.seller === user || user === ADMIN_NICKNAME)) {
        items = items.filter(i => i.id != req.params.id);
        write(ITEMS_FILE, items);
        res.json({ok: true});
    } else {
        res.status(403).json({error: "Нет прав на удаление!"});
    }
});

// --- СООБЩЕНИЯ ---
app.get('/api/messages/:u1/:u2', (req, res) => {
    const msgs = read(CHATS_FILE);
    const filtered = msgs.filter(m => 
        (m.from === req.params.u1 && m.to === req.params.u2) || 
        (m.from === req.params.u2 && m.to === req.params.u1)
    );
    res.json(filtered);
});

app.get('/api/my-inbox/:user', (req, res) => {
    const msgs = read(CHATS_FILE);
    res.json(msgs.filter(m => m.to === req.params.user));
});

app.post('/api/messages', (req, res) => {
    const msgs = read(CHATS_FILE);
    msgs.push({ ...req.body, time: new Date().toLocaleTimeString() });
    write(CHATS_FILE, msgs);
    res.json({ok: true});
});

app.listen(3000, () => console.log("Сервер запущен на порту 3000"));