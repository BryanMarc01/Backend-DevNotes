// server.js
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const db = require('./db');  // Asegúrate que sea el 'db.js' con las ALTER TABLE

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

app.use(cors());

// ======================================
// 1) ENDPOINT PARA ICS (SINCRONIZAR CALENDARIO)
// ======================================
app.get('/export/ical/:noteId', (req, res) => {
  const { noteId } = req.params;
  // Busca la nota
  const note = db.prepare('SELECT * FROM notes WHERE id=?').get(noteId);
  if (!note) {
    return res.status(404).send('Nota no encontrada');
  }

  // Si no tiene fecha, no podemos exportar ICS
  if (!note.startDate) {
    return res.status(400).send('Esta nota no tiene fecha asignada');
  }

  // Convertimos startDate, endDate a formato ICS (YYYYMMDDTHHMMSSZ)
  // Asumimos que note.startDate es '2023-07-15T10:00' (ejemplo)
  // Pequeña función de helper:
  function toICSDate(isoDate) {
    if(!isoDate) return ''; 
    const dateObj = new Date(isoDate);
    const pad = (n) => n.toString().padStart(2,'0');
    // YYYYMMDDTHHMMSSZ
    return (
      dateObj.getUTCFullYear().toString() +
      pad(dateObj.getUTCMonth() + 1) +
      pad(dateObj.getUTCDate()) + 'T' +
      pad(dateObj.getUTCHours()) +
      pad(dateObj.getUTCMinutes()) +
      pad(dateObj.getUTCSeconds()) + 'Z'
    );
  }

  const dtStart = toICSDate(note.startDate);
  const dtEnd   = toICSDate(note.endDate || note.startDate);

  const icsData = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:${note.id}
SUMMARY:${note.title || 'Plan de Viaje'}
DESCRIPTION:${note.content || ''}\\nEnlace: ${note.link || ''}
DTSTAMP:${dtStart}
DTSTART:${dtStart}
DTEND:${dtEnd}
END:VEVENT
END:VCALENDAR`;

  res.setHeader('Content-Type', 'text/calendar');
  res.setHeader('Content-Disposition', `attachment; filename=\"evento-${note.id}.ics\"`);
  res.send(icsData);
});

// ======================================
// 2) SOCKETS
// ======================================
io.on('connection', socket => {
  console.log('Usuario conectado ✅');

  // Enviar notas actuales
  const notes = db.prepare('SELECT * FROM notes').all();
  socket.emit('loadNotes', notes);

  // Enviar costo total inicial
  broadcastTotalCost();

  // -----------------------------------
  // Crear nueva nota (con más campos)
  // -----------------------------------
  socket.on('newNote', note => {
    // Asegurar valores por defecto en caso que no lleguen
    const title     = note.title     || null;
    const content   = note.content   || '';
    const link      = note.link      || null;
    const category  = note.category  || 'other';
    const cost      = note.cost      || 0;
    const x         = note.x         || 100;
    const y         = note.y         || 100;
    const lat       = note.lat       || null;
    const lng       = note.lng       || null;
    const zIndex    = note.zIndex    || 1;
    const minimized = note.minimized ? 1 : 0;
    const startDate = note.startDate || null;
    const endDate   = note.endDate   || null;

    db.prepare(`
      INSERT INTO notes
        (id, title, content, link, category, cost, x, y, lat, lng, zIndex, minimized, startDate, endDate)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      note.id, title, content, link, category, cost, x, y, lat, lng, zIndex, minimized, startDate, endDate
    );

    io.emit('newNote', note);
    broadcastTotalCost();
  });

  // -----------------------------------
  // Actualizar nota
  // -----------------------------------
  socket.on('updateNote', note => {
    // Mismos campos, nos aseguramos que existan
    const title     = note.title     || null;
    const content   = note.content   || '';
    const link      = note.link      || null;
    const category  = note.category  || 'other';
    const cost      = note.cost      || 0;
    const x         = note.x         || 100;
    const y         = note.y         || 100;
    const lat       = note.lat       || null;
    const lng       = note.lng       || null;
    const zIndex    = note.zIndex    || 1;
    const minimized = note.minimized ? 1 : 0;
    const startDate = note.startDate || null;
    const endDate   = note.endDate   || null;

    db.prepare(`
      UPDATE notes
         SET title     = ?,
             content   = ?,
             link      = ?,
             category  = ?,
             cost      = ?,
             x         = ?,
             y         = ?,
             lat       = ?,
             lng       = ?,
             zIndex    = ?,
             minimized = ?,
             startDate = ?,
             endDate   = ?
       WHERE id = ?
    `).run(
      title, content, link, category, cost, x, y, lat, lng, zIndex, minimized, startDate, endDate,
      note.id
    );

    io.emit('updateNote', note);
    broadcastTotalCost();
  });

  // -----------------------------------
  // Eliminar nota
  // -----------------------------------
  socket.on('deleteNote', noteId => {
    db.prepare('DELETE FROM notes WHERE id=?').run(noteId);
    io.emit('deleteNote', noteId);
    broadcastTotalCost();
  });

  // -----------------------------------
  // Desconexión
  // -----------------------------------
  socket.on('disconnect', () => console.log('Usuario desconectado ❌'));
});

// ======================================
// 3) FUNCION PARA ENVIAR COSTO TOTAL A TODOS
// ======================================
function broadcastTotalCost() {
  // Suma de todos los costs
  const result = db.prepare('SELECT SUM(cost) as total FROM notes').get();
  const total = result.total || 0;
  // Envía a todos los sockets el costo total
  io.emit('totalCost', total);
}

// ======================================
// 4) LEVANTAR SERVIDOR
// ======================================
httpServer.listen(3000, () => {
  console.log('Servidor escuchando en http://localhost:3000 o Render...');
});
