const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const flash = require('express-flash');

const app = express();

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());

// Session
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
}));



app.use(cors({
  origin: 'https://savewisezm.com', // frontend domain
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  credentials: true // if you use cookies/auth
}));

const allowedOrigins = ['https://savewisezm.com', 'https://www.savewisezm.com'];
app.use(cors({
  origin: function(origin, callback){
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Routes
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');

app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);

const PORT = process.env.PORT || 3024;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});