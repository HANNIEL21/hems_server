const AuthService = require("../services/AuthService");

class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ message: "Credentials required." });

      const result = await AuthService.loginUser({ email, password });
      
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Days
      });

      return res.status(200).json({ accessToken: result.accessToken, user: result.user });
    } catch (error) {
      return res.status(401).json({ message: error.message });
    }
  }

  async refresh(req, res) {
    try {
      const token = req.cookies?.refreshToken || req.body.refreshToken;
      if (!token) return res.status(401).json({ message: "Refresh token missing." });

      const result = await AuthService.refreshSession(token);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(401).json({ message: error.message });
    }
  }

  async logout(req, res) {
    res.clearCookie("refreshToken");
    return res.status(200).json({ message: "Logged out successfully." });
  }
}

module.exports = new AuthController();