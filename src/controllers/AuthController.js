const AuthService = require("../services/AuthService");

class AuthController {
  root(req, res) {
    const auth = AuthService.root(req, res);
    res.json({ message: "Auth Controller is running", auth });
  }
}

module.exports = new AuthController();
