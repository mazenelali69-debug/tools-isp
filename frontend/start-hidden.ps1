Start-Process "cmd.exe" -ArgumentList '/c cd /d C:\apps\tools-isp\frontend && "C:\Program Files\nodejs\npm.cmd" run dev -- --host 0.0.0.0 --port 5173 --strictPort' -WindowStyle Hidden
