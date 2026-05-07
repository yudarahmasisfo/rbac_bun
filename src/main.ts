import { Elysia } from "elysia";
import {permissionRoutes }  from './ interface/ http/permission.routes';
import { roleRoutes } from './ interface/ http/role.routes';
import { userRoutes } from "./ interface/ http/user.routes";

const app = new Elysia()
  .group("/api/v1", (app) => app.use(permissionRoutes).use(roleRoutes).use(userRoutes))
  .listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);