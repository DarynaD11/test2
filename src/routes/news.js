import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Емуляція __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ініціалізація бази даних
const dbPath = join(__dirname, '../db/news.db');
const db = new sqlite3.Database(dbPath);

// Створення таблиці, якщо не існує
db.run(`CREATE TABLE IF NOT EXISTS news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  content TEXT
)`);

// Публічне: отримати всі новини
function getAllNews(req, res) {
  db.all('SELECT * FROM news ORDER BY id DESC', (err, rows) => {
    if (err) return res.status(500).send(err);
    res.json(rows);
  });
}

// Захищене: додати новину
function addNews(req, res) {
  const { title, content } = req.body;
  db.run(
    'INSERT INTO news (title, content) VALUES (?, ?)',
    [title, content],
    function (err) {
      if (err) return res.status(500).send(err);
      res.status(201).send({ id: this.lastID });
    }
  );
}

// Захищене: видалити новину
function deleteNews(req, res) {
  const { id } = req.params;
  db.run('DELETE FROM news WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).send('Error deleting news');
    if (this.changes === 0) return res.status(404).send('News not found');
    res.send('News deleted successfully');
  });
}

// Експорт
export default {
  getAllNews,
  addNews,
  deleteNews,
};

console.log('DB path:', dbPath);
