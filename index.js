import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { join } from "path";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const port = process.env.PORT || 3000;

// Serve static files (like index.html)
app.use(express.static(join(import.meta.dirname, "src", "public")));

// websocket
io.on("connection", (socket) => {
  // generate unique user id based on device
  console.log("a user connected");

  // Send initial options to the client
  socket.emit("message", {
    text: `
      <p>Welcome! Select an option:</p>
      <p>1. Place an order</p>
      <p>99. Checkout order</p>
      <p>98. See order history</p>
      <p>97. See current order</p>
      <p>0. Cancel order</p>
    `,
  });

  const meals = [
    "Ofada Rice and Chicken",
    "Jollof Rice and Turkey",
    "Amala and Ewedu",
  ];

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
        // save order
        socket.emit("message", { text: "" });
        break;

      case "0":
        // Cancel order
        socket.emit("message", { text: "" });
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
