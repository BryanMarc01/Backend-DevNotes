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

  // Enviar notas actuales desde DB
  db.all('SELECT * FROM notes', (err, notes) => {
    socket.emit('loadNotes', notes);
  });

  socket.on('newNote', note => {
    db.run('INSERT INTO notes (id, content, x, y) VALUES (?, ?, ?, ?)', [note.id, note.content, note.x, note.y]);
    io.emit('newNote', note);
  });

  socket.on('updateNote', note => {
    db.run('UPDATE notes SET content=?, x=?, y=? WHERE id=?', [note.content, note.x, note.y, note.id]);
    io.emit('updateNote', note);
  });

  socket.on('deleteNote', noteId => {
    db.run('DELETE FROM notes WHERE id=?', noteId);
    io.emit('deleteNote', noteId);
  });
  
  socket.on('disconnect', () => console.log('Usuario desconectado ❌'));

  // Al conectar, enviamos las notas actuales:
  db.all('SELECT * FROM notes', (err, notes) => {
    socket.emit('loadNotes', notes);
  });
});

httpServer.listen(3000, () => {
  console.log('Servidor escuchando en http://localhost:3000');
});
