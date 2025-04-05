import dotenv from 'dotenv';

import express from "express"
import cors from 'cors'
import { connect } from "./src/config/DB.js"
import pkg from "whatsapp-web.js";
import qrcode from "qrcode-terminal"
import multer from 'multer';
import { MongoStore } from "wwebjs-mongo"
import mongoose from "mongoose"
import invoiceRouter from "./src/routers/invoicerouter.js"

dotenv.config();
const { Client, LocalAuth, MessageMedia } = pkg;


const app = express()


app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors("*"))


// mongoDB connecting
connect()


const sessionStore = new MongoStore({ mongoose: mongoose });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
const upload = multer({ storage });

app.use("/uploads", express.static("uploads"));


 let client;

async function initializeWhatsApp() {
    client = new Client({
        authStrategy: new LocalAuth({ clientId: "breezy-bot", store: sessionStore }),
    });

    client.on("qr", (qr) => {
        console.log("📌 Scan this QR code to connect:");
        qrcode.generate(qr, { small: true });
    });

    client.on("ready", () => {
        console.log("✅ WhatsApp Bot is ready!");
    });

    client.on("authenticated", () => {
        console.log("✅ WhatsApp authenticated!");
    });

    client.on("message", async (message) => {
        console.log("📩 New message received:", message.body);
    });

    client.on("disconnected", async (reason) => {
        console.log("🚫 WhatsApp Disconnected:", reason);
        console.log("🔄 Reconnecting in 5 seconds...");
        setTimeout(initializeWhatsApp, 5000);
    });

    client.initialize();
}



initializeWhatsApp();




setInterval(async () => {
    console.log("🔄 Checking WhatsApp connection...");
    if (!client || !client.info) {
        console.log("❌ WhatsApp client is disconnected. Restarting...");
        initializeWhatsApp();
    } else {
        console.log("✅ WhatsApp client is active.");
    }
}, 600000); // Every 10 minutes

export default client;

// test route

app.get("/", (req, res) => {
    res.send("Server is running...");
    console.log("test")
  });


  // router

  app.use("/api/invoice",invoiceRouter)

  

  

app.listen(3018, () => {

    console.log("server started")
})

