const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require("cors");
const jwt = require("jsonwebtoken"); // JWT 모듈 추가
const app = express();
const path = require("path");
const multer = require("multer");
const logoutRouter = require("./logout");
require("dotenv").config({ path: "../.env" });

// CORS 설정
app.use(
  cors({
    origin: "http://localhost:3000", // 프론트엔드가 실행 중인 주소
    credentials: true,
  })
);

// Server Listening
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Middleware
app.use(express.json());

// API creation

app.get("/", (req, res) => {
  res.send("Express App is R unning");
});

// Image Storage Engine

const storage = multer.diskStorage({
  destination: "./upload/images",
  filename: (req, file, cb) => {
    return cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({ storage: storage });

// Creating Upload Endpoint for images
app.use("/images", express.static("upload/images"));
app.post("/upload", upload.single("product"), (req, res) => {
  res.json({
    success: 1,
    image_url: `http://localhost:${process.env.PORT}/images/${req.file.filename}`,
  });
});

// Schema for Creating Products

const Product = mongoose.model("Product", {
  id: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  new_price: {
    type: Number,
    required: true,
  },
  old_price: {
    type: Number,
    required: true,
  },
  data: {
    type: Date,
    default: Date.now,
  },
  available: {
    type: Boolean,
    default: true,
  },
});

app.post("/addproduct", async (req, res) => {
  let products = await Product.find({});
  let id;
  if (products.length > 0) {
    let last_product_array = products.slice(-1);
    let last_product = last_product_array[0];
    id = last_product.id + 1;
  } else {
    id = 1;
  }
  const product = new Product({
    id: id,
    name: req.body.name,
    image: req.body.image,
    category: req.body.category,
    new_price: req.body.new_price,
    old_price: req.body.old_price,
  });
  console.log(product);
  await product.save();
  console.log("Saved");
  res.json({
    success: true,
    name: req.body.name,
  });
});

// Creating API for deleting Products

app.post("/", async (req, res) => {
  await Product.findOneAndDelete({ id: req.body.id });
  console.log("Removed");
  res.json({
    success: true,
    name: req.body.name,
  });
});

// Creating API for getting all products
app.get("/allproducts", async (req, res) => {
  let products = await Product.find({});
  console.log("All Products Fetched");
  res.send(products);
});

// Logout Route
app.use("/api", logoutRouter);

// MongoDB Atlas 연결 설정
const mongoURI = process.env.MONGODB_COMPASS;

mongoose
  .connect(mongoURI)
  .then(() => console.log("MongoDB Atlas connected"))
  .catch((err) => console.log("MongoDB Atlas connection error:", err));

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  cartData: { type: Object },
  data: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

// Sign Up Route
app.post("/api/signup", async (req, res) => {
  const { name, email, password } = req.body;

  // 입력값 검증
  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters long." });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists." });
    }

    // 기본 카트 데이터 생성
    let cart = {};
    for (let i = 0; i < 300; i++) {
      cart[i] = 0;
    }

    // 새로운 사용자 생성
    const newUser = new User({
      name,
      email,
      password: await bcrypt.hash(password, 10),
      cartData: cart,
    });

    await newUser.save();

    // JWT 토큰 생성
    const tokenData = {
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    };
    const token = jwt.sign(tokenData, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // 성공 메시지와 토큰 반환
    return res.status(201).json({
      message: "User created successfully",
      token: token,
      user: { id: newUser._id, name: newUser.name, email: newUser.email },
    });
  } catch (error) {
    return res.status(500).json({ error: "Error creating user" });
  }
});

// ID 중복 체크
app.get("/api/check-id/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findOne({ name: id });
    if (user) {
      return res.json({ exists: true });
    } else {
      return res.json({ exists: false });
    }
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
});

// 이메일 중복 체크
app.get("/api/check-email/:email", async (req, res) => {
  const { email } = req.params;
  try {
    const user = await User.findOne({ email });
    if (user) {
      return res.json({ exists: true });
    } else {
      return res.json({ exists: false });
    }
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
});
// isvalidemail function defined
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Login Route with JWT
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  console.log("Received login request:", req.body);

  try {
    const user = await User.findOne({ email });
    console.log("User found in DB:", user);

    if (!user) {
      console.log("No user found with this email");
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match status:", isMatch);

    if (!isMatch) {
      console.log("Password does not match");
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.log("Server error:", error);
    res.status(500).json({ error: "Server error" });
  }
});
