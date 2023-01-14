const express = require("express")
const router = express.Router();
const user = require("../controller/users")

router.get("/", user.getAllUser);
router.post("/", user.createUser);
router.get("/:id", user.getUserById);
router.delete("/delete", user.deleteAllUser)
router.delete("/delete/:id", user.deleteUserById)

module.exports = router;

