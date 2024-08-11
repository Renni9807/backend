/* const express = require("express");
const app = express();

// 예시 데이터
const products = Array.from({ length: 100 }, (v, k) => ({
  id: k + 1,
  name: `Product ${k + 1}`,
  description: `Description for product ${k + 1}`,
  price: Math.floor(Math.random() * 100) + 1,
}));

app.get("/api/products", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 9;
  const offset = (page - 1) * limit;

  const paginatedProducts = products.slice(offset, offset + limit);
  res.json(paginatedProducts);
});

// 서버 시작
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
*/
