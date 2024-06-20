import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { join } from "path";
import session from "express-session";
import MemoryStore from "memorystore";

const MemoryStoreInstance = MemoryStore(session);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const port = process.env.PORT || 3000;
const sessionMiddleware = session({
  secret: "your-secret-key",
  resave: false,
  saveUninitialized: true,
  store: new MemoryStoreInstance({
    checkPeriod: 86400000,
  }),
});

app.use(express.static(join(import.meta.dirname, "src", "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);

app.get("/", (req, res) => {
  if (req.session.username) {
    res.redirect("/chat");
    return;
  }
  res.sendFile(join(import.meta.dirname, "src", "public", "index.html"));
});

app.post("/", (req, res) => {
  req.session.username = req.body.username;
  res.redirect("/chat");
});

app.get("/chat", (req, res) => {
  if (req.session.username) {
    res.sendFile(join(import.meta.dirname, "src", "public", "chat.html"));
    return;
  }
  res.redirect("/");
});

// websocket

const userSessions = {};

io.engine.use(sessionMiddleware);

io.on("connection", (socket) => {
  // generate unique user id based on device
  const { id } = socket.request.session;
  console.log(id);
  if (!userSessions.hasOwnProperty(id)) {
    userSessions[id] = {
      currentOrderHIstory: [],
      orderHistory: [],
      chatHistory: [],
      chatState: "INITIAL",
    };
  }
  console.log("a user connected");

  const meals = [
    "Ofada Rice and Chicken",
    "Jollof Rice and Turkey",
    "Amala and Ewedu",
  ];

  const welcomeMessage = `
      <p>Welcome! Select an option:</p>
      <p>1. Place an order</p>
      <p>99. Checkout order</p>
      <p>98. See order history</p>
      <p>97. See current order</p>
      <p>0. Cancel order</p>
    `;
  // Send initial options to the client
  socket.emit("message", {
    text: welcomeMessage,
  });

  let mealList = "<p>Select an item:</p>";
  meals.forEach((meal, index) => {
    const letter = String.fromCharCode(65 + index); // 65 is ASCII for 'A'
    mealList += `<p>${letter}. ${meal}</p>`;
  });

  // Handle messages from client
  socket.on("message", (message) => {
    console.log("Message from client:", message);

    switch (message) {
      case "1":
        socket.emit("message", {
          text: mealList,
        });
        break;
      case "97":
        // Show current order
        userSessions.id.currentOrderHIstory;
        socket.emit("message", {
          text: "",
        });
        break;
      case "98":
        // Show order history

        socket.emit("message", {
          text: "",
        });
        break;
      case "99":
        // save/checkout order
        const { orderHistory, currentOrderHistory } = userSessions.id;
        userSessions.id.orderHistory.push(currentOrderHistory[0]);
        userSessions.id.currentOrderHistory = [];
        socket.emit("message", { text: "Order saved and sent" });
        break;

      case "0":
        // Cancel order
        userSessions.id.currentOrderHistory = [];
        socket.emit("message", { text: "Order cancelled" });
        break;
      case "a":
        userSessions.id.currentOrderHistory.push(meals[0]);
        socket.emit("message", { text: `<p>${meals[0]} ordered</p>` });
        break;
      case "b":
        userSessions.id.currentOrderHIstory.push(meals[1]);
        socket.emit("message", { text: `<p>${meals[1]} ordered</p>` });
        break;
      case "c":
        userSessions.id.currentOrderHIstory.push(meals[2]);
        socket.emit("message", { text: `<p>${meals[2]} ordered</p>` });
        break;
      default:
        socket.emit("message", {
          text: "Invalid option. Please choose again.",
        });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

httpServer.listen(port, () => {
  console.log(`Server started on port: ${port}`);
});
