const UserService = require("../services/UserService");

class UserController {
  async register(req, res) {
    try {
      const { firstname, lastname, email, password, role_id, phone_number } = req.body;
      if (!firstname || !lastname || !email || !password || !role_id || !phone_number) {
        return res.status(400).json({ message: "All fields are required." });
      }
      const result = await UserService.createUser({ firstname, lastname, email, password, role_id, phone_number });
      return res.status(201).json({ message: "User registered successfully.", userId: result.userId });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const users = await UserService.getAllUsers();
      return res.status(200).json(users);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getOne(req, res) {
    try {
      const user = await UserService.getUserById(req.params.id);
      return res.status(200).json(user);
    } catch (error) {
      return res.status(404).json({ message: error.message });
    }
  }

  async update(req, res) {
    try {
      const { firstname, lastname, role_id, phone_number } = req.body;
      await UserService.updateUser(req.params.id, { firstname, lastname, role_id, phone_number });
      return res.status(200).json({ message: "User updated successfully." });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  async delete(req, res) {
    try {
      await UserService.deleteUser(req.params.id);
      return res.status(200).json({ message: "User deleted successfully." });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
}

module.exports = new UserController();