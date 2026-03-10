$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root   = "C:\apps\tools-isp"
$Server = Join-Path $Root "backend\server.js"

if (!(Test-Path $Server)) { throw "Missing: $Server" }

Set-Location $Root

$ts = Get-Date -Format "yyyyMMdd-HHmmss"
$bk = Join-Path $Root "_SAVES\FIX-TPLINK-JETSTREAM-$ts"
New-Item -ItemType Directory -Force -Path $bk | Out-Null
Copy-Item $Server (Join-Path $bk "server.js.bak") -Force

$txt = Get-Content $Server -Raw -Encoding UTF8

# شيل أي بلوك قديم إذا موجود
$txt = [regex]::Replace(
  $txt,
  '(?ms)\s*/\* TP-LINK-JETSTREAM-HEALTH-START \*/.*?/\* TP-LINK-JETSTREAM-HEALTH-END \*/\s*',
  ''
)

$blockLines = @(
'/* TP-LINK-JETSTREAM-HEALTH-START */',
'app.get("/api/tplink-jetstream/health", async (req, res) => {',
'  try {',
'    const targets = [',
'      { ip: "88.88.88.254", community: "public" },',
'      { ip: "10.88.88.254", community: "public" }',
'    ];',
'',
'    const OID_SYSNAME   = "1.3.6.1.2.1.1.5.0";',
'    const OID_SYSUPTIME = "1.3.6.1.2.1.1.3.0";',
'    const OID_IFNUMBER  = "1.3.6.1.2.1.2.1.0";',
'',
'    const toNum = (v) => {',
'      if (v === null || v === undefined) return 0;',
'      if (typeof v === "number") return Number.isFinite(v) ? v : 0;',
'      if (typeof v === "bigint") return Number(v);',
'      if (Buffer.isBuffer(v)) {',
'        try {',
'          let n = 0n;',
'          for (const b of v.values()) n = (n << 8n) + BigInt(b);',
'          return Number(n);',
'        } catch { return 0; }',
'      }',
'      const n = Number(v);',
'      return Number.isFinite(n) ? n : 0;',
'    };',
'',
'    const vbVal = (vb) => {',
'      if (!vb) return null;',
'      try { if (snmp.isVarbindError(vb)) return null; } catch {}',
'      return vb.value;',
'    };',
'',
'    async function readOne(ip, community) {',
'      let session = null;',
'      try {',
'        session = snmp.createSession(ip, community, {',
'          version: snmp.Version2c,',
'          timeout: 1800,',
'          retries: 0',
'        });',
'',
'        const basics = await snmpGet(session, [OID_SYSNAME, OID_SYSUPTIME, OID_IFNUMBER]);',
'',
'        const sysName   = String(vbVal(basics?.[0]) ?? ip);',
'        const sysUpTime = toNum(vbVal(basics?.[1]));',
'        const ifNumber  = toNum(vbVal(basics?.[2]));',
'',
'        let portsUp = 0;',
'        let portsDown = 0;',
'',
'        if (ifNumber > 0) {',
'          const oids = [];',
'          for (let i = 1; i <= ifNumber; i++) {',
'            oids.push(`1.3.6.1.2.1.31.1.1.1.1.${i}`);',
'            oids.push(`1.3.6.1.2.1.2.2.1.8.${i}`);',
'          }',
'',
'          const vbs = await snmpGet(session, oids);',
'',
'          for (let i = 0; i < vbs.length; i += 2) {',
'            const ifName = String(vbVal(vbs[i]) ?? "").trim();',
'            const oper   = toNum(vbVal(vbs[i + 1]));',
'            if (!ifName) continue;',
'            if (oper === 1) portsUp++;',
'            else portsDown++;',
'          }',
'        }',
'',
'        return {',
'          ok: true,',
'          ip,',
'          sysName,',
'          model: "TP-Link JetStream",',
'          firmware: "N/A",',
'          sysUpTime,',
'          cpuPercent: 0,',
'          temperatureC: 0,',
'          freeMemoryBytes: 0,',
'          databaseSizeBytes: 0,',
'          portsTotal: ifNumber,',
'          portsUp,',
'          portsDown,',
'          traffic: { rxMbps: 0, txMbps: 0 }',
'        };',
'      } catch (e) {',
'        return {',
'          ok: false,',
'          ip,',
'          error: String(e?.message || e || "SNMP read failed"),',
'          model: "TP-Link JetStream",',
'          firmware: "N/A",',
'          sysUpTime: 0,',
'          cpuPercent: 0,',
'          temperatureC: 0,',
'          freeMemoryBytes: 0,',
'          databaseSizeBytes: 0,',
'          portsTotal: 0,',
'          portsUp: 0,',
'          portsDown: 0,',
'          traffic: { rxMbps: 0, txMbps: 0 }',
'        };',
'      } finally {',
'        try { if (session) session.close(); } catch {}',
'      }',
'    }',
'',
'    const switches = [];',
'    for (const t of targets) {',
'      switches.push(await readOne(t.ip, t.community));',
'    }',
'',
'    return res.json({ ok: true, switches });',
'  } catch (e) {',
'    return res.status(500).json({',
'      ok: false,',
'      error: String(e?.message || e || "TP-Link JetStream health failed")',
'    });',
'  }',
'});',
'/* TP-LINK-JETSTREAM-HEALTH-END */'
)

$block = ($blockLines -join "`r`n") + "`r`n`r`n"
$anchor = 'const PORT = process.env.PORT || 9090;'

if ($txt.Contains($anchor)) {
  $txt = $txt.Replace($anchor, $block + $anchor)
} else {
  throw "Anchor not found: $anchor"
}

[System.IO.File]::WriteAllText($Server, $txt, [System.Text.UTF8Encoding]::new($false))
Write-Host "Route inserted." -ForegroundColor Green

pm2 restart tools-isp-backend | Out-Null
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "=== TEST ===" -ForegroundColor Cyan
try {
  $r = Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:9090/api/tplink-jetstream/health" -TimeoutSec 12
  Write-Host ("HTTP " + $r.StatusCode) -ForegroundColor Green
  $r.Content
}
catch {
  Write-Host "TEST FAILED" -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Backup: $bk" -ForegroundColor Yellow
