const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");
let db = null;
module.exports = app;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running Sucessfully");
    });
  } catch (error) {
    console.log(`DB Error ${error.message}`);
  }
};

initializeDbAndServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  if (password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  }
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const getUserDetailsQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(getUserDetailsQuery);
  if (dbUser === undefined) {
    const createUserQuery = `
     INSERT INTO 
        user (username, name, password, gender, location) 
      VALUES 
        (
          '${username}', 
          '${name}',
          '${hashedPassword}', 
          '${gender}',
          '${location}'
        )`;
    const dbResponse = await db.run(createUserQuery);
    const newUserId = dbResponse.lastID;
    response.send("User created successfully");
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const getUserDetailsQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(getUserDetailsQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const userDetails = request.body;
  const { username, oldPassword, newPassword } = userDetails;
  const getUserDetailsQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(getUserDetailsQuery);
  const isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password);
  if (newPassword.length < 5) {
    response.status(400);
    response.send("Password is too short");
  }
  const hashedPassword = await bcrypt.hash(userDetails.newPassword, 10);
  if (isPasswordMatched === true) {
    const UpdateUserDetails = `UPDATE user SET password = '${hashedPassword}' WHERE username = '${username}'`;
    await db.run(UpdateUserDetails);
    response.status(200);
    response.send("Password updated");
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});
