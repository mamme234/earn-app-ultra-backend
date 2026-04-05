const express = require('express');
const app = express();

app.use(express.json());

let users = {};

app.post('/login', (req, res) => {
  const { username, ref } = req.body;

  if (!users[username]) {
    users[username] = { coins: 0, referrals: 0, lastClaim: 0 };

    if (ref && users[ref]) {
      users[ref].coins += 50;
      users[ref].referrals += 1;
    }
  }

  res.json(users[username]);
});

app.post('/add', (req, res) => {
  const { username, coins } = req.body;
  if (users[username]) users[username].coins += coins;
  res.json(users[username]);
});

app.post('/daily', (req, res) => {
  const { username } = req.body;
  const now = Date.now();

  if (users[username]) {
    if (now - users[username].lastClaim > 86400000) {
      users[username].coins += 100;
      users[username].lastClaim = now;
      return res.json({ message: "Daily claimed", user: users[username] });
    } else {
      return res.json({ message: "Already claimed" });
    }
  }
});

app.post('/withdraw', (req, res) => {
  const { username, amount } = req.body;

  if (!users[username]) return res.json({ error: "User not found" });
  if (users[username].coins < amount) return res.json({ error: "Not enough coins" });
  if (users[username].referrals < 5) return res.json({ error: "Need 5 referrals" });

  users[username].coins -= amount;
  res.json({ message: "Withdraw successful" });
});

app.get('/user/:username', (req, res) => {
  res.json(users[req.params.username] || { coins: 0 });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));