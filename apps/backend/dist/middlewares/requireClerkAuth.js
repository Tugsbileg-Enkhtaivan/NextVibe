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
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.optionalClerkAuth = exports.requireClerkAuth = void 0;
const express_1 = require("@clerk/express");
const requireClerkAuth = (req, res, next) => {
    try {
        const { userId } = (0, express_1.getAuth)(req);
        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Valid authentication token is required'
            });
            return;
        }
        req.userId = userId;
        req.user = { id: userId };
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid authentication token'
        });
    }
};
exports.requireClerkAuth = requireClerkAuth;
const optionalClerkAuth = (req, res, next) => {
    try {
        const { userId } = (0, express_1.getAuth)(req);
        if (userId) {
            req.userId = userId;
            req.user = { id: userId };
        }
        next();
    }
    catch (error) {
        console.error('Optional auth error:', error);
        next();
    }
};
exports.optionalClerkAuth = optionalClerkAuth;
const requireRole = (allowedRoles) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { has } = (0, express_1.getAuth)(req);
            if (!req.userId) {
                res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Authentication required'
                });
                return;
            }
            const hasRequiredRole = allowedRoles.some(role => has && has({ role }));
            if (!hasRequiredRole) {
                res.status(403).json({
                    error: 'Forbidden',
                    message: 'Insufficient permissions'
                });
                return;
            }
            next();
        }
        catch (error) {
            console.error('Role check error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Error checking permissions'
            });
        }
    });
};
exports.requireRole = requireRole;
//# sourceMappingURL=requireClerkAuth.js.map