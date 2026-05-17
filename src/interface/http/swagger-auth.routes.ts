import { Elysia, t } from "elysia";
import { appConfig } from "../../config/app.config";

export const swaggerAuthRoutes = new Elysia()
  // --- LOGOUT SWAGGER ---
  .get("/logout-swagger", ({ cookie, set }) => {
    // Hapus cookie sesi
    cookie.swagger_session?.remove();
    
    // Gunakan HTML + Script untuk memaksa browser pindah halaman (Breakout dari Swagger UI)
    set.headers['content-type'] = 'text/html';
    return `
      <script>window.location.href = "/swagger-login";</script>
      <p>Logging out... <a href="/swagger-login">Click here if not redirected</a></p>
    `;
  })

  // --- SWAGGER LOGIN (Simple Form) ---
  .get("/swagger-login", ({ set }) => {
    set.headers['content-type'] = 'text/html';
    return `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login Swagger Documentation</title>
      </head>
      <body style="margin:0; background:#f4f7f6; font-family:sans-serif;">
        <div style="display:flex; justify-content:center; align-items:center; height:100vh;">
          <form action="/swagger-login" method="POST" style="background:#fff; padding:30px; border-radius:10px; box-shadow:0 4px 6px rgba(0,0,0,0.1); width:300px;">
            <h2 style="margin-top:0; color:#333;">Swagger Access</h2>
            <p style="color:#666; font-size:14px;">Masukkan kredensial khusus untuk mengakses dokumentasi API.</p>
            <input type="text" name="username" placeholder="Username" style="width:100%; box-sizing:border-box; padding:10px; margin-bottom:15px; border:1px solid #ddd; border-radius:5px;" required />
            <input type="password" name="password" placeholder="Password" style="width:100%; box-sizing:border-box; padding:10px; margin-bottom:15px; border:1px solid #ddd; border-radius:5px;" required />
            <button type="submit" style="width:100%; padding:10px; background:#007bff; color:#fff; border:none; border-radius:5px; cursor:pointer; font-weight:bold;">Login</button>
            <a href="/" style="display:block; text-align:center; margin-top:15px; color:#666; font-size:12px; text-decoration:none;">Kembali ke Home</a>
          </form>
        </div>
      </body>
      </html>
    `;
  })
  .post("/swagger-login", ({ body: { username, password }, cookie: { swagger_session }, set, redirect }) => {
    if (username === appConfig.swagger.user && password === appConfig.swagger.password) {
      swagger_session?.set({
        value: 'authenticated',
        httpOnly: true,
        path: '/',
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production'
      });
      return redirect("/swagger");
    } else {
      set.headers['content-type'] = 'text/html';
      return "Kredensial salah. <a href='/swagger-login'>Coba lagi</a>";
    }
  }, {
    body: t.Object({
      username: t.String(),
      password: t.String()
    })
  });