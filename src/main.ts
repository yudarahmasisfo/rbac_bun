import "dotenv/config";
import { Elysia } from "elysia";
import { html } from "@elysiajs/html";
import { swagger } from "@elysiajs/swagger";
import { permissionRoutes } from "./interface/http/permission.routes";
import { roleRoutes } from "./interface/http/role.routes";
import { userRoutes } from "./interface/http/user.routes";
import { authRoutes } from "./interface/http/auth.routes";
import { db } from "./infrastructure/database/prisma-client";
import { healthHtmlTemplate } from "./infrastructure/views/health-template";
import { menuRoutes } from "./interface/http/menu.routes";

// Ambil port dari .env atau gunakan 3000 sebagai default
const PORT = process.env.PORT || 3000;

const app = new Elysia()
  .use(html()) // Aktifkan dukungan HTML
  .use(
    swagger({
      documentation: {
        info: {
          title: "RBAC Bun JS Documentation",
          version: "1.0.0",
          description: "Dokumentasi API untuk sistem Full RBAC Standar Enterprise",
        },
        tags: [
          { name: "System", description: "Status dan Health Check" },
          { name: "Authentication", description: "Otentikasi dan Sesi" },
          { name: "Permissions", description: "Manajemen Izin Akses" },
          { name: "Roles", description: "Manajemen Peran" },
          { name: "Users", description: "Manajemen Pengguna" },
          { name: "Menus", description: "Manajemen Sidebar dan Navigasi" }
        ],
        components: {
          securitySchemes: {
            BearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
          },
        },
      },
      path: "/swagger",
    })
  )

  // --- HEALTH CHECK & LANDING PAGE ---
  .get("/", 
    async ({ headers }: { headers: Record<string, string | undefined> }) => {
      let dbStatus = "Connected";
      try {
        await db.$queryRaw`SELECT 1`;
      } catch {
        dbStatus = "Disconnected";
      }

      const uptimeSeconds = process.uptime();
      const data = {
        status: "Online",
        database: dbStatus,
        uptime: `${(uptimeSeconds / 60).toFixed(2)} Minutes`,
        uptime_raw: uptimeSeconds,
        timestamp: new Date().toISOString(),
        timestamp_formatted: new Date().toLocaleString('id-ID')
      };

      if (headers['accept']?.includes('application/json')) {
        return data;
      }

      return healthHtmlTemplate({
        status: data.status,
        database: data.database,
        uptime: data.uptime,
        timestamp: data.timestamp_formatted
      });
    },
    {
      detail: {
        summary: "Status Sistem",
        description: "Mengecek kesehatan sistem, koneksi database, dan uptime server.",
        tags: ["System"]
      }
    }
  )

  // --- API ROUTES ---
  .group("/api/v1", (app) =>
    app
      .use(authRoutes)
      .use(permissionRoutes)
      .use(roleRoutes)
      .use(userRoutes)
      .use(menuRoutes)
  );

app.routes.forEach(route => {
    console.log(`${route.method} ${route.path}`);
});

// --- LISTEN ---
app.listen(PORT);

console.log(`\n🦊 Elysia Research Mode is active!`);
console.log(
  `🚀 Server running at: http://${app.server?.hostname}:${app.server?.port}`,
);
console.log(
  `🔗 Health Check: http://${app.server?.hostname}:${app.server?.port}/`,
);
