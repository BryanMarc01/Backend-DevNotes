const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const db = require('./db');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

app.use(cors());

io.on('connection', socket => {
  console.log('Usuario conectado ✅');

  const notes = db.prepare('SELECT * FROM notes').all();
  socket.emit('loadNotes', notes);

  socket.on('newNote', note => {
    db.prepare('INSERT INTO notes (id, content, x, y) VALUES (?, ?, ?, ?)').run(note.id, note.content, note.x, note.y);
    io.emit('newNote', note);
  });

  socket.on('updateNote', note => {
    db.prepare('UPDATE notes SET content=?, x=?, y=? WHERE id=?').run(note.content, note.x, note.y, note.id);
    io.emit('updateNote', note);
  });

  socket.on('deleteNote', noteId => {
    db.prepare('DELETE FROM notes WHERE id=?').run(noteId);
    io.emit('deleteNote', noteId);
  });

  socket.on('disconnect', () => console.log('Usuario desconectado ❌'));
});

httpServer.listen(3000, () => {
  console.log('Servidor escuchando en http://localhost:3000');
});
