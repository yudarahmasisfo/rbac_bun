import "dotenv/config";
import { Elysia, t } from "elysia";
import { html } from "@elysiajs/html";
import { swagger } from "@elysiajs/swagger";
import { permissionRoutes } from "./interface/http/permission.routes";
import { roleRoutes } from "./interface/http/role.routes";
import { userRoutes } from "./interface/http/user.routes";
import { authRoutes } from "./interface/http/auth.routes";
import { db } from "./infrastructure/database/prisma-client";
import { healthHtmlTemplate } from "./infrastructure/views/health-template";
import { menuRoutes } from "./interface/http/menu.routes";
import { swaggerAuthRoutes } from "./interface/http/swagger-auth.routes";
import { appConfig } from "./config/app.config";

const app = new Elysia({
  cookie: {
    secrets: appConfig.jwt.secret, // Gunakan secrets (jamak) untuk konfigurasi cookie global
    sign: ['swagger_session'],    // Tandatangani cookie swagger_session
    path: '/'                    // Set default path global agar cookie tersedia di semua rute
  }
})
  .use(html()) // Aktifkan dukungan HTML
  .error({
    // Daftarkan tipe error kustom jika diperlukan
    NOT_FOUND: Error,
    UNAUTHORIZED: Error,
    VALIDATION_ERROR: Error
  })
  .onError(({ code, error, set }) => {
    // Mapping status code berdasarkan pesan error atau tipe error
    const message = error instanceof Error ? error.message : String(error);
    
    switch (code) {
      case 'VALIDATION':
      case 'VALIDATION_ERROR':
        set.status = 400;
        break;
      case 'NOT_FOUND':
        set.status = 404;
        break;
      case 'UNAUTHORIZED':
        set.status = 401;
        break;
      default:
        set.status = 500;
        break;
    }

    return { success: false, error: message };
  })
  
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
  )

  // --- SWAGGER AUTH ROUTES ---
  .use(swaggerAuthRoutes)

  // --- PROTECTED SWAGGER (Diletakkan terakhir agar mendeteksi semua rute di atas) ---
  .guard({
    beforeHandle({ cookie, request, redirect }) {
      const url = new URL(request.url);
      const { swagger_session } = cookie;
      
      // Hanya minta login jika mengakses path /swagger
      const isSwaggerDocs = 
        url.pathname === '/swagger' || 
        url.pathname === '/swagger/' || 
        url.pathname.startsWith('/swagger/');

      if (isSwaggerDocs) {
        // Cek apakah cookie ada dan nilainya benar
        if (!swagger_session?.value || swagger_session.value !== 'authenticated') {
          return redirect("/swagger-login");
        }
      }
    }
  })
  .use(swagger({
    path: "/swagger",
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
          BearerAuth: { 
            type: "http", 
            scheme: "bearer", 
            bearerFormat: "JWT",
            description: "Masukkan Access Token hasil login di sini" 
          },
        },
      },
    },
  }));

app.routes.forEach(route => {
    console.log(`${route.method} ${route.path}`);
});

// --- LISTEN ---
app.listen(appConfig.port);

console.log(`\n🦊 Elysia Research Mode is active!`);
console.log(
  `🚀 Server running at: http://${app.server?.hostname}:${app.server?.port}`,
);
console.log(
  `🔗 Health Check: http://${app.server?.hostname}:${app.server?.port}/`,
);
