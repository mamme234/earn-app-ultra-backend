const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

let users = {};
let withdrawals = [];

// LOGIN
app.post('/login', (req, res) => {
  const { username, ref } = req.body;

  if (!users[username]) {
    users[username] = {
      coins: 0,
      referrals: 0,
      joinedTelegram: false,
      lastDaily: 0
    };

    if (ref && users[ref]) {
      users[ref].coins += 100;
      users[ref].referrals++;
    }
  }

  res.json(users[username]);
});

// TAP
app.post('/tap', (req, res) => {
  const { username } = req.body;
  users[username].coins += 10;
  res.json(users[username]);
});

// DAILY
app.post('/daily', (req, res) => {
  const { username } = req.body;
  const now = Date.now();

  if (now - users[username].lastDaily > 86400000) {
    users[username].coins += 100;
    users[username].lastDaily = now;
    return res.json({ message: "Daily claimed", user: users[username] });
  }

  res.json({ message: "Already claimed today" });
});

// SPIN
app.post('/spin', (req, res) => {
  const { username } = req.body;
  const win = Math.floor(Math.random() * 300) + 20;
  users[username].coins += win;
  res.json({ win, user: users[username] });
});

// TELEGRAM JOIN
app.post('/join-telegram', (req, res) => {
  const { username } = req.body;
  users[username].joinedTelegram = true;
  users[username].coins += 500;
  res.json(users[username]);
});

// TASK REWARD
app.post('/reward', (req, res) => {
  const { username, type } = req.body;

  const rewards = {
    youtube: 100,
    tiktok: 1000
  };

  users[username].coins += rewards[type] || 0;
  res.json(users[username]);
});

// WITHDRAW
app.post('/withdraw', (req, res) => {
  const { username, amount, wallet } = req.body;

  const user = users[username];
  const usdt = user.coins / 100;

  if (!user.joinedTelegram) return res.json({ error: "Join Telegram first" });
  if (usdt < 20) return res.json({ error: "Minimum 20 USDT" });
  if (user.referrals < 3) return res.json({ error: "Need 3 referrals" });

  user.coins -= amount * 100;

  withdrawals.push({
    username,
    amount,
    wallet,
    status: "pending"
  });

  res.json({ message: "Withdraw request sent" });
});

// ADMIN
app.get('/admin/withdrawals', (req, res) => {
  res.json(withdrawals);
});

app.post('/admin/approve', (req, res) => {
  const { index } = req.body;
  withdrawals[index].status = "approved";
  res.json({ message: "Approved" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
