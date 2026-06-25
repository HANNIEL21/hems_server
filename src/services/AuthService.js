class AuthService {
  root(req, res) {
    res.send("Auth Service is running");
  }
}

module.exports = new AuthService();
