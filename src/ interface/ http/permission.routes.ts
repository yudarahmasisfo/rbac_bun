import { Elysia, t } from "elysia";
import { PrismaPermissionRepository } from "../../ infrastructure/ repositories/prisma-permission.repository";
import { GetPermissionsUseCase, CreatePermissionUseCase } from "../../ application/ usecases/get-permissions.usecase";

const permissionRepo = new PrismaPermissionRepository();
const getPermissionsUseCase = new GetPermissionsUseCase(permissionRepo);
const createPermissionUseCase = new CreatePermissionUseCase(permissionRepo);

export const permissionRoutes = new Elysia({ prefix: '/permissions' })
  .get("/", () => getPermissionsUseCase.execute())
  .post("/", async ({ body }) => {
    return await createPermissionUseCase.execute(body.name, body.description);
  }, {
    body: t.Object({
      name: t.String(),
      description: t.Optional(t.String())
    })
  });