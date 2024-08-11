const express = require("express");
const router = express.Router();

router.post("/logout", (req, res) => {
  // 로그아웃 시 세션이나 쿠키를 정리할 수 있습니다.
  // 프론트엔드에서 토큰을 삭제할 수 있도록 메시지를 전달합니다.
  res.status(200).json({ message: "Logged out successfully" });
});

module.exports = router;
