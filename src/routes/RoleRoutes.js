const express = require("express");
const RoleController = require("../controllers/RoleController");

const router = express.Router();

router.post("/", RoleController.create);
router.get("/", RoleController.getAll);
router.get("/:id", RoleController.getById);
router.put("/:id", RoleController.update);
router.delete("/:id", RoleController.delete);

module.exports = router;