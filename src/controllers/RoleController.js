const RoleService = require("../services/RoleService");

class RoleController {
  async create(req, res) {
    try {
      const { role_name, description } = req.body;
      if (!role_name) return res.status(400).json({ message: "Role name is required." });

      const role = await RoleService.createRole({ role_name, description });
      return res.status(201).json({ message: "Role created successfully.", role });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const roles = await RoleService.getAllRoles();
      return res.status(200).json(roles);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const role = await RoleService.getRoleById(req.params.id);
      return res.status(200).json(role);
    } catch (error) {
      return res.status(404).json({ message: error.message });
    }
  }

  async update(req, res) {
    try {
      const { role_name, description } = req.body;
      if (!role_name) return res.status(400).json({ message: "Role name is required." });

      await RoleService.updateRole(req.params.id, { role_name, description });
      return res.status(200).json({ message: "Role updated successfully." });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  async delete(req, res) {
    try {
      await RoleService.deleteRole(req.params.id);
      return res.status(200).json({ message: "Role deleted successfully." });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
}

module.exports = new RoleController();