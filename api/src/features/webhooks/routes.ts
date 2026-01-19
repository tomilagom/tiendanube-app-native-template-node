import { Router } from "express";
import * as controller from "./controller";

const routes = Router();

routes.post("/order/created", controller.handleOrderCreated);
routes.post("/order/paid", controller.handleOrderPaid);
routes.post("/order/cancelled", controller.handleOrderCancelled);

export { routes };
