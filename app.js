const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const morgan = require("morgan");
const connectDatabase = require("./config/db");
const createHttpError = require("http-errors");
const session = require("express-session");
const connectFlash = require("connect-flash");
const connectMongo = require("connect-mongo");
const passport = require("passport");
const { ensureLoggedIn } = require("connect-ensure-login");

require("dotenv").config();

connectDatabase();

const app = express();
require("dotenv");

// Port
const PORT = process.env.PORT || 4000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static Files
app.use(express.static("public"));
app.use("/admin", express.static(__dirname + "public/admin"));
app.use("/shop", express.static(__dirname + "public/shop"));
app.use(morgan("dev"));
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            // secure: true
            httpOnly: true,
        },
    })
);

app.use(passport.initialize());
app.use(passport.session());
require("./utils/passport.auth");

app.use(connectFlash());

// Template View Engine
app.use(expressLayouts);
app.set("view engine", "ejs");

// Routes
const shopRoute = require("./routes/shop/shopRouter");
const adminRoute = require("./routes/admin/adminRoutes");
const { default: mongoose } = require("mongoose");

app.use("/", shopRoute);
app.use("/admin", adminRoute);

app.get("*", (req, res) => {
    res.render("404", { title: "404", page: "404" });
});

app.listen(PORT, () => console.log(`Server running @ http://localhost:${PORT}`));
