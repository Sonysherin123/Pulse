
require('dotenv').config()

const mongoose = require("mongoose");
// Connect to MongoDB
mongoose.connect(process.env.MONGODB)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

const express = require('express');
const path = require('path');
const userRoute = require('./routes/userRoute'); 
const adminRoute=require('./routes/adminRoute');
const bodyParser = require('body-parser')
const session=require('express-session');
const nocache=require('nocache');
const app = express();
const PORT = process.env.PORT ||7272 ;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



app.use(express.json());
app.use(express.urlencoded({
   extended: true
}));

//Session configuration
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
       maxAge: 3600000
    }
 }));

 app.use(nocache());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views','user'));
app.use('/', express.static(path.join(__dirname, 'public')));
app.use("/admin", express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//for user routes
app.use('/',userRoute);
//for admin
app.use('/admin',adminRoute);




app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}/`);
});