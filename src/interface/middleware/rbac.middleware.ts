import error from "elysia";

export const rbacMiddleware = (requiredPermission: string) => (context: any) => {
  const { jwt, headers, set } = context;

  return {
    async check() {
      // 1. Ambil token dari header Authorization: Bearer <token>
      const authHeader = headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        set.status = 401;
        return { error: "Token tidak ditemukan. Silakan login terlebih dahulu." };
      }

      const token = authHeader.split(' ')[1];

      // 2. Verifikasi Token
      const payload = await jwt.verify(token);
      if (!payload) {
        set.status = 401;
        return { error: "Sesi telah berakhir atau token tidak valid." };
      }

      // 3. Cek Permission
      // Payload.permissions berasal dari data yang kita set di LoginUseCase
      const userPermissions: string[] = payload.permissions || [];
      
      const hasPermission = userPermissions.includes(requiredPermission);

      if (!hasPermission) {
        set.status = 403;
        return { 
          error: `Akses ditolak. Anda memerlukan izin '${requiredPermission}' untuk mengakses fitur ini.` 
        };
      }

      // Jika lolos, simpan data user ke context agar bisa dipakai di route/controller
      return { user: payload };
    }
  };
};