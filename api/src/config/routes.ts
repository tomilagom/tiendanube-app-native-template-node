import { Router } from "express";
import passport from "passport";
import express from 'express';

import { AuthenticationController } from "@features/auth";
import { ProductController } from "@features/product";
import { routes as ConfigRoutes } from "@features/config";
import { routes as WebhookRoutes } from "@features/webhooks";

const routes = Router();

// Webhooks (Unprotected by JWT, verified inside or open)
// Using app.use or routes.use?
// Since these usually come with their own path prefix
routes.use("/webhooks", express.json(), WebhookRoutes);

routes.get("/auth/install", AuthenticationController.install);

// Protected Routes
routes.use(
    "/config",
    passport.authenticate("jwt", { session: false }),
    ConfigRoutes
);

routes.post(
  "/products",
  passport.authenticate("jwt", { session: false }),
  ProductController.create
);

routes.get(
  "/products/total",
  passport.authenticate("jwt", { session: false }),
  ProductController.getTotal
);
routes.get(
  "/products",
  passport.authenticate("jwt", { session: false }),
  ProductController.getAll
);
routes.delete(
  "/products/:id",
  passport.authenticate("jwt", { session: false }),
  ProductController.delete
);

export default routes;
