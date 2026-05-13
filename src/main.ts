import "dotenv/config";
import { Elysia } from "elysia";
import { html } from "@elysiajs/html";
import { permissionRoutes } from "./interface/http/permission.routes";
import { roleRoutes } from "./interface/http/role.routes";
import { userRoutes } from "./interface/http/user.routes";
import { authRoutes } from "./interface/http/auth.routes";
import { db } from "./infrastructure/database/prisma-client";
import { healthHtmlTemplate } from "./infrastructure/views/health-template";

// Ambil port dari .env atau gunakan 3000 sebagai default
const PORT = process.env.PORT || 3000;

const app = new Elysia()
  .use(html()) // Aktifkan dukungan HTML

  // --- HEALTH CHECK & LANDING PAGE ---
.get("/", async ({ headers }: { headers: Record<string, string | undefined> }) => {
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
      uptime_raw: uptimeSeconds, // Data mentah untuk front-end
      timestamp: new Date().toISOString(),
      timestamp_formatted: new Date().toLocaleString('id-ID')
    };

    // CEK REQUEST: Jika header 'Accept' meminta JSON, kirim JSON mentah.
    // Ini biasanya dipanggil oleh Front-end via fetch() atau Axios.
    if (headers['accept']?.includes('application/json')) {
      return data;
    }

    // DEFAULT: Jika dibuka langsung lewat Browser, kirim Dashboard HTML.
    return healthHtmlTemplate({
      status: data.status,
      database: data.database,
      uptime: data.uptime,
      timestamp: data.timestamp_formatted
    });
  })

  // --- API ROUTES ---
  .group("/api/v1", (app) =>
    app
      .use(authRoutes)
      .use(permissionRoutes)
      .use(roleRoutes)
      .use(userRoutes)
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
