const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const functions = require("firebase-functions");
const { fileParser } = require("express-multipart-file-parser");
const routerUsers = require("./routers/routerUsers");
const routerCourseworks = require("./routers/routerCourseworks");
const { authMiddleware } = require("./middlewares");

const app = express();
// enable cors
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    if (req.method === "OPTIONS") {
      res.header(
        "Access-Control-Allow-Methods",
        "PUT, POST, PATCH, DELETE, GET"
      );
      return res.status(200).json({});
    }
    return next();
  });
}
// parse cookies
app.use(cookieParser());
// parse user
app.use(authMiddleware);
// parse files
app.use(
  fileParser({
    busboyOptions: {
      limits: {
        fileSize: 1000 * 1000 * 5 // mb
      }
    }
  })
);

// define web router
const toIndex = (req, res, next) => {
  res.sendFile(path.join(__dirname, "./web-build/index.html"));
};
app.get("/login", toIndex);
app.get("/register", toIndex);
app.get("/courseworks", toIndex);
app.get("/upload", toIndex);
// define api router
const routerAPI = express.Router();
routerAPI.use("/users", routerUsers);
routerAPI.use("/courseworks", routerCourseworks);
app.use("/api", routerAPI);

exports.app = functions.https.onRequest(app);
