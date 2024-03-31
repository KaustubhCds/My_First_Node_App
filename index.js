import express from "express";
import path from "path";
import mongoose, { mongo } from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { redirect } from "react-router-dom";
import bcrypt from "bcrypt";
mongoose
  .connect("mongodb://127.0.0.1:27017", {
    dbName: "backend",
  })
  .then(() => console.log("Database is connected"))
  .catch((e) => console.log(e));

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const User = mongoose.model("User", userSchema);

const app = express();

//using middlewares
app.use(express.static(path.join(path.resolve(), "public")));
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(cookieParser());

const users = [];

app.set("view engine", "ejs");

const isAuthenticates = async (req, res, next) => {
  const { token } = req.cookies;

  if (token) {
    const decoded = jwt.verify(token, "wrwhrkhwelr");
    req.user = await User.findById(decoded._id);

    next();
  } else {
    res.redirect("/login");
  }
};
app.get("/", isAuthenticates, (req, res) => {
  console.log(req.user);

  res.render("logout", { name: req.user.name });
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
});
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  let user = await User.findOne({ email });
  if (user) {
    return res.redirect("/login");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  user = await User.create({
    name,
    email,
    password: hashedPassword,
  });
  const token = jwt.sign({ _id: user._id }, "wrwhrkhwelr");
  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });

  console.log(token);
  res.redirect("/");
});

app.get("/logout", (req, res) => {
  res.render("login");
});
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  let user = await User.findOne({ email });

  if (user) {
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.redirect("/login");
    } else {
      const token = jwt.sign({ _id: user._id }, "wrwhrkhwelr");
      res.cookie("token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 60 * 1000),
      });

      console.log(token);
      res.redirect("/");
    }
  } else {
    res.redirect("/register");
  }
});

app.listen(3000, () => {
  console.log("App is running  on port ", 3000);
});
