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
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).send({ massage: "UnAuthorized access" });
  }
  const token = authHeader.split(" ")[1];
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

    // varify admin
    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requesterAccount = await userCollaction.findOne({
        email: requester,
      });
      if (requesterAccount.role === "admin") {
        next();
      } else {
        res.status(403).send({ message: "forbidden" });
      }
    };

    // get all product api
    app.get("/product", async (req, res) => {
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
        expiresIn: "30d",
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
    app.get("/admin", jwtVerify, verifyAdmin, async (req, res) => {
      const result = await userCollaction.find().toArray();
      res.send(result);
    });

    // make user to admin
    app.put("/user_admin/:email", jwtVerify, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const option = { upsert: true };
      const doc = {
        $set: { role: "admin" },
      };
      const result = await userCollaction.updateOne(query, doc, option);
      res.send(result);

      // delete admin or user on mongodb
      app.delete("/onlyuser/:id", jwtVerify, verifyAdmin, async (req, res) => {
        const id = req.params.id;
        console.log(id);
        const quary = { _id: ObjectId(id) };
        const result = await userCollaction.deleteOne(quary);
        res.send(result);
      });
    });

    // update user
    app.put("/onlyuser/:email", jwtVerify, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const user = req.body;
      const option = { upsert: true };
      const doc = {
        $set: user,
      };

      const result = await userCollaction.updateOne(filter, doc, option);
      res.send(result);
    });

    // specific user search by email
    app.get("/onlyuser/:email", jwtVerify, async (req, res) => {
      const email = req.params.email;
      const quary = { email: email };
      const result = await userCollaction.findOne(quary);
      res.send(result);
    });

    // get all order by admin
    app.get("/order", jwtVerify, verifyAdmin, async (req, res) => {
      const result = await orderCollaction.find().toArray();
      res.send(result);
    });

    // manage all order details by id
    app.get("/manage/:id", jwtVerify, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollaction.findOne(query);
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
