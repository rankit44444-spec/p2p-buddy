const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(
  session({
    secret: "p2p-secret",
    resave: false,
    saveUninitialized: true,
  })
);

// In-memory data (demo only)
let users = [];
let ads = [];
let adminEmail = "admin@demo.com";

// Helper
function isLoggedIn(req) {
  return req.session.user;
}

// HOME
app.get("/", (req, res) => {
  res.send(`
    <h2>P2P Buddy Demo</h2>
    <a href="/register">Register</a> |
    <a href="/login">Login</a>
  `);
});

// REGISTER
app.get("/register", (req, res) => {
  res.send(`
    <h3>Register</h3>
    <form method="post">
      Email: <input name="email" required /><br/>
      Password: <input name="password" type="password" required /><br/>
      <button>Register</button>
    </form>
  `);
});

app.post("/register", (req, res) => {
  users.push({
    email: req.body.email,
    password: req.body.password,
    approved: false,
    trialEnd: Date.now() + 24 * 60 * 60 * 1000,
    role: req.body.email === adminEmail ? "admin" : "user",
  });

  res.send("Registered successfully. Admin will review your application.");
});

// LOGIN
app.get("/login", (req, res) => {
  res.send(`
    <h3>Login</h3>
    <form method="post">
      Email: <input name="email" /><br/>
      Password: <input name="password" type="password" /><br/>
      <button>Login</button>
    </form>
  `);
});

app.post("/login", (req, res) => {
  const user = users.find(
    (u) => u.email === req.body.email && u.password === req.body.password
  );

  if (!user) return res.send("Invalid credentials");
  if (!user.approved && user.role !== "admin")
    return res.send("Admin approval pending");

  req.session.user = user;
  res.redirect("/dashboard");
});

// DASHBOARD
app.get("/dashboard", (req, res) => {
  if (!isLoggedIn(req)) return res.redirect("/login");

  if (Date.now() > req.session.user.trialEnd) {
    return res.send(`
      <h3>Free Trial Ended</h3>
      Contact admin at <b>@CryptoMartAdmin</b>
    `);
  }

  let adminMenu =
    req.session.user.role === "admin"
      ? `<a href="/admin">Admin Panel</a><br/><br/>`
      : "";

  let adRows = ads
    .map(
      (a, i) =>
        `<tr>
          <td>${a.type}</td>
          <td>${a.qty}</td>
          <td>${a.price}</td>
          <td>${a.nick}</td>
          <td>${a.contact}</td>
          ${
            req.session.user.role === "admin"
              ? `<td><a href="/delete/${i}">Delete</a></td>`
              : ""
          }
        </tr>`
    )
    .join("");

  res.send(`
    ${adminMenu}
    <h3>P2P Ads</h3>
    <form method="post" action="/post-ad">
      <select name="type">
        <option>BUY</option>
        <option>SELL</option>
      </select>
      Qty: <input name="qty" required />
      Price: <input name="price" required />
      Nickname: <input name="nick" required />
      Telegram: <input name="contact" required />
      <button>Post Ad</button>
    </form>

    <p><i>Disclaimer: We only show ads. Trade at your own risk.</i></p>

    <table border="1">
      <tr>
        <th>Type</th><th>Qty</th><th>Price</th><th>Nick</th><th>Contact</th><th></th>
      </tr>
      ${adRows}
    </table>

    <br/>
    <a href="/logout">Logout</a>
  `);
});

// POST AD
app.post("/post-ad", (req, res) => {
  if (!isLoggedIn(req)) return res.redirect("/login");

  ads.push({
    type: req.body.type,
    qty: req.body.qty,
    price: req.body.price,
    nick: req.body.nick,
    contact: req.body.contact,
  });

  res.redirect("/dashboard");
});

// ADMIN PANEL
app.get("/admin", (req, res) => {
  if (!isLoggedIn(req) || req.session.user.role !== "admin")
    return res.send("Unauthorized");

  let userList = users
    .map(
      (u, i) =>
        `${u.email} - Approved: ${u.approved}
         <a href="/approve/${i}">Approve</a><br/>`
    )
    .join("");

  res.send(`
    <h3>Admin Panel</h3>
    ${userList}
    <br/><a href="/dashboard">Back</a>
  `);
});

// APPROVE USER
app.get("/approve/:id", (req, res) => {
  users[req.params.id].approved = true;
  res.redirect("/admin");
});

// DELETE AD
app.get("/delete/:id", (req, res) => {
  ads.splice(req.params.id, 1);
  res.redirect("/dashboard");
});

// LOGOUT
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

app.listen(3000, () => console.log("Running"));
