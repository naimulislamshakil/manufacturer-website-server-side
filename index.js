const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const verify = require("jsonwebtoken/verify");
require("dotenv").config();
const port = process.env.PORT || 5000;

// madelware
app.use(cors());
app.use(express.json());

// verify jwt token client
const jwtVerify = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    res.status(401).send({ massage: "UnAuthorized access" });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.TOKEN_ACCESS_KEY, function (err, decoded) {
    if (err) {
      return res.status(403).send({ massage: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_ACCESS_USERNAME}:${process.env.DB_ACCESS_PASS}@cluster0.z5hwi.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();

    // product collaction
    const productCollaction = client
      .db("laptop_manufaction")
      .collection("product");

    // order collaction
    const orderCollaction = client.db("laptop_manufaction").collection("order");

    // review collaction
    const reviewCollaction = client
      .db("laptop_manufaction")
      .collection("review");

    // user collaction
    const userCollaction = client.db("laptop_manufaction").collection("user");

    // get all product api
    app.get("/product", jwtVerify, async (req, res) => {
      const result = await productCollaction.find().toArray();
      res.send(result);
    });

    // specific search by id
    app.get("/id_product/:id", jwtVerify, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollaction.findOne(query);
      res.send(result);
    });

    // post order on mongodb
    app.post("/order", async (req, res) => {
      const orderDetails = req.body;
      const result = await orderCollaction.insertOne(orderDetails);
      res.send(result);
    });

    // get order on mongodb
    app.get("/order/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await orderCollaction.find(query).toArray();
      res.send(result);
    });

    // get specific order details on mongodb
    app.get("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollaction.findOne(query);
      res.send(result);
    });

    // delete order details on mongodb
    app.delete("/delete/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const quary = { _id: ObjectId(id) };
      const result = await orderCollaction.deleteOne(quary);
      res.send(result);
    });

    // post review on mongodb
    app.post("/review", async (req, res) => {
      const review = req.body;
      const result = await reviewCollaction.insertOne(review);
      res.send(result);
    });

    // get review on mongodb
    app.get("/review", async (req, res) => {
      const result = await reviewCollaction.find().toArray();
      res.send(result);
    });

    // put user on mongoodb
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const quary = { email: email };
      const doc = {
        $set: user,
      };
      const option = { upsert: true };
      const result = await userCollaction.updateOne(quary, doc, option);
      const token = jwt.sign({ email: email }, process.env.TOKEN_ACCESS_KEY, {
        expiresIn: "1h",
      });
      res.send({ result, token });
    });

    // make sure user is admin
    app.get("/admin/:email", jwtVerify, async (req, res) => {
      const email = req.params.email;
      const user = await userCollaction.findOne({ email: email });
      const admin = user.role === "admin";
      res.send({ admin: admin });
    });

    // all user show for admin
    app.get("/admin", jwtVerify, async (req, res) => {
      const result = await userCollaction.find().toArray();
      res.send(result);
    });
  } finally {
    // await client.close()
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("How Are You?");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
