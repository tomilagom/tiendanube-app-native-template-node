import { Router } from "express";
import * as controller from "./controller";

const routes = Router();

routes.get("/", controller.getConfig);
routes.post("/", controller.updateConfig);

export { routes };
