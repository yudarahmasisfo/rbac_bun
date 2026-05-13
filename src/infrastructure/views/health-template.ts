export const healthHtmlTemplate = (data: {
  status: string;
  uptime: string;
  database: string;
  timestamp: string;
}) => `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Status | Research Mode</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap');
        body { font-family: 'Inter', sans-serif; background: #0f172a; }
        .glass { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); }
        .status-pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
    </style>
</head>
<body class="flex items-center justify-center min-h-screen text-slate-200">
    <div class="glass p-8 rounded-3xl shadow-2xl w-full max-w-md">
        <div class="flex flex-col items-center mb-8">
            <div class="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>
            <h1 class="text-2xl font-600 tracking-tight">Elysia <span class="text-indigo-400">RBAC System</span></h1>
            <p class="text-slate-400 text-sm mt-1">Research & Development Mode</p>
        </div>

        <div class="space-y-4">
            <div class="flex items-center justify-between p-4 rounded-2xl bg-slate-800/50">
                <span class="text-sm text-slate-400">System Status</span>
                <div class="flex items-center">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 mr-2 status-pulse"></span>
                    <span class="font-medium text-emerald-400">${data.status}</span>
                </div>
            </div>

            <div class="flex items-center justify-between p-4 rounded-2xl bg-slate-800/50">
                <span class="text-sm text-slate-400">Database</span>
                <span class="font-medium ${data.database === 'Connected' ? 'text-indigo-400' : 'text-rose-400'}">${data.database}</span>
            </div>

            <div class="flex items-center justify-between p-4 rounded-2xl bg-slate-800/50">
                <span class="text-sm text-slate-400">Uptime</span>
                <span class="font-medium text-slate-200">${data.uptime}</span>
            </div>
        </div>

        <div class="mt-8 pt-6 border-t border-slate-700/50 text-center">
            <p class="text-[10px] uppercase tracking-widest text-slate-500">Last Checked</p>
            <p class="text-xs text-slate-400 mt-1">${data.timestamp}</p>
        </div>
    </div>
</body>
</html>
`;