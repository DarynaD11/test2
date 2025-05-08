import express from 'express';
import path from 'path';
import bcrypt from 'bcrypt';
import bodyParser from 'body-parser';
import session from 'express-session';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import newsController from './src/routes/news.js';

// Ініціалізація змінних середовища
dotenv.config();

// Отримуємо кореневий шлях (__dirname заміна в ES-модулі)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.error('ERROR: ADMIN_PASSWORD is not set in .env');
  process.exit(1);
}

let hashedPassword;

// Хешування пароля адміністратора
bcrypt.hash(ADMIN_PASSWORD, 10, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
    throw err;
  }
  hashedPassword = hash;
  console.log('Password hashed successfully');
});

// Перевірка автентифікації
function isAuthenticated(req, res, next) {
  if (req.session.authenticated) {
    return next();
  }
  res.status(401).send('Unauthorized');
}

// Парсери
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Сесії
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'secret-key',
    resave: false,
    saveUninitialized: true,
  })
);

// Публічні новини
app.get('/api/news', newsController.getAllNews);

// Адмін маршрути
app.post('/api/news/add-news', isAuthenticated, newsController.addNews);
app.delete(
  '/api/news/delete-news/:id',
  isAuthenticated,
  newsController.deleteNews
);

// Статичні файли з папки src
app.use(express.static(join(__dirname, 'src')));

// Логін
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  bcrypt.compare(password, hashedPassword, (err, result) => {
    if (err) return res.status(500).send('Server error');
    if (result) {
      req.session.authenticated = true;
      res.sendStatus(200);
    } else {
      res.sendStatus(401);
    }
  });
});

// Логаут
app.post('/admin/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send('Logout failed');
    res.sendStatus(200);
  });
});

// Видача адмін-панелі
app.get('/admin.html', (req, res) => {
  res.sendFile(join(__dirname, 'src', 'admin.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
