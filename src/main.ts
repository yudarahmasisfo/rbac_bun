import "dotenv/config";
import { Elysia, t } from "elysia";
import { html } from "@elysiajs/html";
import { swagger } from "@elysiajs/swagger";
import { rateLimit } from 'elysia-rate-limit';
import { permissionRoutes } from "./interface/http/permission.routes";
import { roleRoutes } from "./interface/http/role.routes";
import { userRoutes } from "./interface/http/user.routes";
import { authRoutes } from "./interface/http/auth.routes";
import { db } from "./infrastructure/database/prisma-client";
import { healthHtmlTemplate } from "./infrastructure/views/health-template";
import { menuRoutes } from "./interface/http/menu.routes";
import { swaggerAuthRoutes } from "./interface/http/swagger-auth.routes";
import { appConfig } from "./config/app.config";
import { AuditLogRepository } from "./infrastructure/repositories/audit-log.repository";

const auditLogRepo = new AuditLogRepository();

const app = new Elysia({
  cookie: {
    secrets: appConfig.jwt.secret, // Gunakan secrets (jamak) untuk konfigurasi cookie global
    sign: ['swagger_session'],    // Tandatangani cookie swagger_session
    path: '/'                    // Set default path global agar cookie tersedia di semua rute
  }
})
  .use(html()) // Aktifkan dukungan HTML
  // --- LAPIS 1: GLOBAL RATE LIMIT ---
  .use(
    rateLimit({
      // Tambahkan generator untuk membantu mendeteksi IP jika otomatis gagal
      generator: (request, server) => {
        return request?.headers?.get('x-forwarded-for')?.split(',')[0] || server?.hostname || 'unknown-client';
      },
      max: 100, // Maksimal 100 request
      duration: 60000, // Per 1 menit
      errorResponse: new Response(JSON.stringify({
        success: false,
        error: "Terlalu banyak permintaan (Global). Silakan coba lagi nanti."
      }), { status: 429, headers: { 'Content-Type': 'application/json' } })
    })
  )
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
        set.status = 400;
        // Mencoba mengambil pesan error yang lebih spesifik dari Elysia Validation
        if ('all' in error) {
           return { 
             success: false, 
             error: "Input tidak valid", 
             details: (error as any).all.map((err: any) => ({
               path: err.path.replace('/', ''),
               message: err.message
             }))
           };
        }
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
  // --- GLOBAL AUDIT LOG HOOK ---
  .onAfterResponse(async (context) => {
    const { request, body, set } = context;
    const user = (context as any).user;
    const method = request.method;
    const status = set.status as number;
    
    // Hanya log jika request sukses dan merupakan metode modifikasi data
    const loggableMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    
    if (loggableMethods.includes(method) && status >= 200 && status < 300) {
      // Gunakan base URL 'http://localhost' untuk menghindari error jika request.url kosong atau relatif
      const url = new URL(request.url || '/', appConfig.appUrl);
      const pathParts = url.pathname.split('/');
      
      // Deteksi resource dari URL (misal: /api/v1/users -> Resource: users)
      const resource = pathParts[3] || 'unknown';
      const targetId = pathParts[4] || null;

      // Map method ke action
      const actionMap: Record<string, string> = {
        'POST': 'CREATE',
        'PUT': 'UPDATE',
        'PATCH': 'UPDATE',
        'DELETE': 'DELETE'
      };

      // Filter sensitive data dari payload sebelum disimpan ke audit log
      let filteredPayload = body;
      if (body && typeof body === 'object') {
        const sensitiveFields = ['password', 'token', 'secret'];
        const tempBody = { ...body as Record<string, any> };
        sensitiveFields.forEach(field => {
          if (field in tempBody) tempBody[field] = '[REDACTED]';
        });
        filteredPayload = tempBody;
      }

      await auditLogRepo.create({
        userId: (user as any)?.id,
        username: (user as any)?.username,
        action: actionMap[method] || 'UNKNOWN',
        resource: resource.toUpperCase(),
        targetId: targetId,
        payload: filteredPayload ? JSON.stringify(filteredPayload) : undefined,
      });
    }
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

console.log(`\n🦊 Elysia RBAC Mode is active!`);
console.log(
  `🚀 Server running at: ${appConfig.appUrl}`,
);
console.log(
  `🔗 Health Check: ${appConfig.appUrl}/`,
);
