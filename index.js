const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.sw3jgjt.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        const productsCollection = client.db("shopDb").collection("products");
        const brandCollection = client.db("brandDB").collection("brands");
        const cartCollection = client.db("shopDb").collection("cart");

        //jwt related api
        //jwt related api
        app.post("/jwt", async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.Access_Token_Secret, { expiresIn: "1h" });
            res.send({ token });
        });
        // middlewares
        const verifyToken = (req, res, next) => {
            if (!req.headers.authorization) {
                return res.status(401).send({ message: "unauthorized access" });
            }
            const token = req.headers.authorization.split(" ")[1];
            jwt.verify(token, process.env.Access_Token_Secret, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: "unauthorized access" });
                }
                req.decoded = decoded;
                next();
            });
        };

        //products related api
        app.get("/products", async (req, res) => {
            const cursor = productsCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });
        app.get("/products/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await productsCollection.findOne(query);
            res.send(result);
        });

        app.post("/products", verifyToken, async (req, res) => {
            const newProducts = req.body;
            console.log(newProducts);
            const result = await productsCollection.insertOne(newProducts);
            res.send(result);
        });

        app.put("/products/:id", verifyToken, async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const fetchProduct = req.body;
            const updatedProduct = {
                $set: {
                    name: fetchProduct.name,
                    brandName: fetchProduct.brandName,
                    type: fetchProduct.type,
                    price: fetchProduct.price,
                    shortDesc: fetchProduct.shortDesc,
                    ratings: fetchProduct.ratings,
                    photo: fetchProduct.photo,
                    keyFeature: fetchProduct.keyFeature,
                    desc: fetchProduct.desc,
                },
            };

            const result = await productsCollection.updateOne(filter, updatedProduct, options);
            console.log(result);
            res.send(result);
        });

        //For Brands
        app.get("/brands", async (req, res) => {
            const cursor = brandCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });
        app.post("/brands", async (req, res) => {
            const newBrand = req.body;
            console.log(newBrand);
            const result = await brandCollection.insertOne(newBrand);
            res.send(result);
        });

        //For Cart
        app.get("/cart", verifyToken, async (req, res) => {
            const cursor = cartCollection.find();
            const users = await cursor.toArray();
            res.send(users);
        });
        app.post("/cart", verifyToken, async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await cartCollection.insertOne(user);
            res.send(result);
        });

        app.delete("/cart/:id", verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await cartCollection.deleteOne(query);
            res.send(result);
        });

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("Brand-Shop Server is Running");
});

app.listen(port, () => {
    console.log(`server is running on port ${port}`);
});
