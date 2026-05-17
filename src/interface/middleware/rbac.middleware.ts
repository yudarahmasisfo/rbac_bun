export const rbacMiddleware = (requiredPermission: string) => (context: any) => {
  const { accessJwt, cookie: { access_token }, set } = context;

  return {
    async check() {
      // 1. Ambil token dari HttpOnly Cookie (Bukan dari Header)
      const token = access_token.value;
      
      if (!token) {
        set.status = 401;
        return { error: "Sesi tidak ditemukan atau telah berakhir. Silakan login kembali." };
      }

      // 2. Verifikasi Token
      const payload = await accessJwt.verify(token);
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