import { Elysia } from "elysia";
import {permissionRoutes }  from './ interface/ http/permission.routes';

const app = new Elysia()
  .group("/api/v1", (app) => app.use(permissionRoutes))
  .listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);