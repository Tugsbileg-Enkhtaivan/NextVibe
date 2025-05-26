"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuery = void 0;
const validateQuery = (req, res, next) => {
    if (!req.query.mood) {
        res.status(400).json({ error: "Missing mood" });
        return;
    }
    next();
};
exports.validateQuery = validateQuery;
exports.default = exports.validateQuery;
//# sourceMappingURL=validateQuery.js.map