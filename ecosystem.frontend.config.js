module.exports = {
  apps: [
    {
      name: "tools-isp-frontend",
      cwd: "C:\\apps\\tools-isp\\frontend",
      script: "C:\\Windows\\System32\\cmd.exe",
      args: ["/c", "npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"],
      interpreter: "none"
    }
  ]
}
