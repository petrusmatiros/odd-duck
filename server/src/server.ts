import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { createServer } from "node:http";
import { Server } from "socket.io";
import helmet from "helmet";
import cryptoRandomString from "crypto-random-string";
// import session from "express-session";

import path from "node:path";
import { Logger } from "../utils/log-utils";

// load environment variables from .env file
config();

const logger = new Logger("Server");

const PORT = process.env.PORT || 8080;
const API_URL = process.env.API_URL || "http://localhost:8000";

const app = express();
const server = createServer(app);

const io = new Server(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
});

// Middleware to set security headers
io.engine.use(helmet());

// // Middleware for session management
// io.engine.use(session({
//   secret: "keyboard cat",
//   resave: false,
//   saveUninitialized: true,
//   cookie: { secure: true }
// }));

// Middleware to parse JSON requests
app.use(express.json());

// Middleware to parse URL-encoded requests
app.use(cors());

// Middleware to serve static files
const staticFileDirectoryPath = "../../client/out";
const pathToStaticFiles = path.join(__dirname, staticFileDirectoryPath);

app.use(express.static(pathToStaticFiles));

const indexFileName = "index.html";

app.get("/", (req, res) => {
	logger.log(`Serving ${indexFileName}`);

	logger.log(path.join(pathToStaticFiles, indexFileName));
	res.sendFile(path.join(pathToStaticFiles, indexFileName), (err) => {
		if (err) {
			logger.error(`Error sending ${indexFileName}:`, err);
			res.status(err.status).end();
		} else {
			logger.log(`${indexFileName} sent successfully`);
		}
	});
});

server.listen(PORT, () => {
	logger.log(`Server is running on port ${PORT}`);
});

// no disconnect event will be emitted if the client is not connected
io.use((socket, next) => {
	const token = socket.handshake.auth.token;
	const id = socket.id;

	if (!token) {
		logger.log("No token provided");
		return next(new Error("Authentication error"));
	}

	// Verify the token here (e.g., using JWT)
	// If valid, call next()
	// If invalid, call next(new Error("Authentication error"))
	logger.log(`Token: ${token}`);
	next();
});

io.on("connection", (socket) => {
	logger.log("a user connected");
	const randomString = cryptoRandomString({length: 6, type: 'distinguishable'});
	logger.log(`Random string: ${randomString}`);
	socket.on("disconnect", () => {
		logger.log("user disconnected");

		// // join the room named 'some room'
		// socket.join('some room');

		// // broadcast to all connected clients in the room
		// io.to('some room').emit('hello', 'world');

		// // broadcast to all connected clients except those in the room
		// io.except('some room').emit('hello', 'world');

		// // leave the room
		// socket.leave('some room');
	});
});
