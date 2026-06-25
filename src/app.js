const express = require("express");
const AuthRoute = require("./routes/AuthRoute");
const UserRoutes = require("./routes/userRoutes");
const RoleRoutes = require("./routes/RoleRoutes");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/api", (req, res) => {
  res.send("Hello World!");
});
app.use("/api/auth", AuthRoute);
app.use("/api/users", UserRoutes);
app.use("/api/roles", RoleRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Something went wrong!" });
});

module.exports = app;
