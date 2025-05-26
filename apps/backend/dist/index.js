"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const cors_1 = __importDefault(require("cors"));
const aiSongRouter_1 = __importDefault(require("./routes/aiSongRouter"));
// import spotifyRouter from "./routes/spotifyRouter";
const requireClerkAuth_1 = require("./middlewares/requireClerkAuth");
const express_2 = require("@clerk/express");
dotenv_1.default.config();
console.log("Clerk keys:", {
    pk: process.env.CLERK_PUBLISHABLE_KEY,
    sk: process.env.CLERK_SECRET_KEY,
});
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
app.use((0, express_2.clerkMiddleware)());
app.use((0, cors_1.default)({ origin: 'http://localhost:3000', credentials: true }));
app.use(express_1.default.json());
app.use("/api/ai-song", aiSongRouter_1.default);
// app.use("/api/spotify", spotifyRouter);
app.get("/", requireClerkAuth_1.requireClerkAuth, (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma.user.findMany();
        res.json(users);
    }
    catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
}));
app.post("/users", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email } = req.body;
    if (!username || !email) {
        res.status(400).json({ error: "Username and email are required" });
        return;
    }
    try {
        const user = yield prisma.user.create({
            data: { username, email },
        });
        res.json({ message: "User created successfully", user });
    }
    catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: "Failed to create user" });
    }
}));
app.use("/{*any}", (req, res) => {
    res.status(404).json({ error: "Route not found" });
});
const originalUse = app.use;
app.use = function (path, ...args) {
    console.log("app.use called with path:", path);
    return originalUse.call(this, path, ...args);
};
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Shutting down gracefully...');
    yield prisma.$disconnect();
    process.exit(0);
}));
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
//# sourceMappingURL=index.js.map