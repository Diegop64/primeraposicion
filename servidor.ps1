# Primera Posicion: servidor local sencillo para Windows (sin instalar nada).
# Sirve esta carpeta en http://localhost:8080 y abre el navegador.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8080
$types = @{
  '.html'='text/html; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.js'='application/javascript; charset=utf-8';
  '.woff2'='font/woff2'; '.svg'='image/svg+xml'; '.png'='image/png'; '.jpg'='image/jpeg'; '.ico'='image/x-icon'; '.json'='application/json'
}
$listener = New-Object System.Net.HttpListener
while ($true) {
  try { $listener.Prefixes.Clear(); $listener.Prefixes.Add("http://localhost:$port/"); $listener.Start(); break }
  catch { $port++; if ($port -gt 8099) { throw "No hay ningun puerto libre entre 8080 y 8099." } $listener = New-Object System.Net.HttpListener }
}
$url = "http://localhost:$port/"
Write-Host ""
Write-Host "  Primera Posicion esta funcionando en $url" -ForegroundColor Green
Write-Host "  Deja esta ventana abierta mientras estudias. Cierrala para apagar el servidor."
Write-Host ""
Start-Process $url
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
  if ($path -eq '') { $path = 'index.html' }
  $file = [IO.Path]::GetFullPath((Join-Path $root $path))
  $res = $ctx.Response
  try {
    if ($file.StartsWith($root) -and (Test-Path $file -PathType Leaf)) {
      $bytes = [IO.File]::ReadAllBytes($file)
      $ext = [IO.Path]::GetExtension($file).ToLower()
      $res.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' }
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $res.StatusCode = 404
      $msg = [Text.Encoding]::UTF8.GetBytes('No encontrado')
      $res.OutputStream.Write($msg, 0, $msg.Length)
    }
  } catch { } finally { $res.Close() }
}
