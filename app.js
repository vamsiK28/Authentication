const express = require("express");
const app = express();
const { open } = require("sqlite");
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");
app.use(express.json());
let db = null;

const startServerAndConnectDb = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
  } catch (e) {
    console.log(`Database Error: ${e}`);
  }
  app.listen(3000, () => {
    console.log("Server running at: http://localhost:3000/");
  });
};

startServerAndConnectDb();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `select * from user where username = '${username}'`;
  const user = await db.get(selectUserQuery);
  if (user === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const putNewUserQuery = `insert into user(username,name,password,gender,location)
        values ('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
      const result = await db.run(putNewUserQuery);
      const newId = result.lastId;
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `select * from user where username like '${username}'`;
  const user = await db.get(selectUserQuery);
  if (user === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isSamePassword = await bcrypt.compare(password, user.password);
    if (isSamePassword) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  let { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `select * from user where username like '${username}'`;
  const user = await db.get(selectUserQuery);
  const isSamePassword = await bcrypt.compare(oldPassword, user.password);
  if (isSamePassword) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      const updatePasswordQuery = `
            update user 
            set password='${hashedNewPassword}'
            where username like '${username}';
            `;
      const result = await db.run(updatePasswordQuery);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});
module.exports = app;
