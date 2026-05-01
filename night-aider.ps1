# night-aider.ps1
# Aider Auto (Ollama) + checkpoints + check final + desligar

$ErrorActionPreference = "Stop"

# =========================
# CONFIG
# =========================
$PROJECT = "E:\IA\projects\Site_React_Backup"
$OUTDIR  = Join-Path $PROJECT "_night"
$LOGDIR  = Join-Path $OUTDIR "logs"
$DATE    = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

$MODEL = "ollama/deepseek-coder-v2:16b"

$SHUTDOWN_ON_SUCCESS = $true
$SHUTDOWN_DELAY_SEC  = 60

# Quantas iterações máximas por grupo (evita loop infinito)
$MAX_PASSES_PER_GROUP = 3

# =========================
# HELPERS
# =========================
function Ensure-Dir($path) {
  if (!(Test-Path $path)) { New-Item -ItemType Directory -Path $path | Out-Null }
}

function Git-HasChanges {
  $s = git status --porcelain
  return ($s -and $s.Length -gt 0)
}

function Git-Checkpoint($message) {
  if (Git-HasChanges) {
    git add -A | Out-Null
    git commit -m $message | Out-Null
    Write-Host ("Commit criado: {0}" -f $message) -ForegroundColor Green
  } else {
    Write-Host "Sem mudanças para commitar." -ForegroundColor DarkGray
  }
}

function Run-Cmd([string]$name, [string]$cmd, [string[]]$args, [bool]$optional=$false) {
  $logPath = Join-Path $LOGDIR ("{0}_{1}.log" -f $DATE, $name)

  Write-Host ""
  Write-Host "====================" -ForegroundColor Cyan
  Write-Host ("STEP: {0}" -f $name) -ForegroundColor Cyan
  Write-Host ("CMD : {0} {1}" -f $cmd, ($args -join " ")) -ForegroundColor Cyan
  Write-Host ("LOG : {0}" -f $logPath) -ForegroundColor Cyan
  Write-Host "====================" -ForegroundColor Cyan

  $pinfo = New-Object System.Diagnostics.ProcessStartInfo
  $pinfo.FileName = $cmd
  $pinfo.WorkingDirectory = $PROJECT
  $pinfo.RedirectStandardOutput = $true
  $pinfo.RedirectStandardError  = $true
  $pinfo.UseShellExecute = $false
  $pinfo.Arguments = ($args -join " ")

  $p = New-Object System.Diagnostics.Process
  $p.StartInfo = $pinfo
  [void]$p.Start()

  $stdout = $p.StandardOutput.ReadToEnd()
  $stderr = $p.StandardError.ReadToEnd()
  $p.WaitForExit()

  ($stdout + "`n" + $stderr) | Out-File -FilePath $logPath -Encoding UTF8

  if ($p.ExitCode -ne 0) {
    if ($optional) {
      Write-Host ("(Opcional) Falhou: {0} (Exit {1}) - seguindo..." -f $name, $p.ExitCode) -ForegroundColor Yellow
      return $false
    } else {
      Write-Host ("Falhou: {0} (Exit {1})" -f $name, $p.ExitCode) -ForegroundColor Red
      throw ("STEP FAILED: {0}" -f $name)
    }
  }

  Write-Host ("OK: {0}" -f $name) -ForegroundColor Green
  return $true
}

function Get-TscErrorsText {
  # roda tsc e devolve output (mesmo em erro)
  $logPath = Join-Path $LOGDIR ("{0}_tsc_capture.log" -f $DATE)

  $pinfo = New-Object System.Diagnostics.ProcessStartInfo
  $pinfo.FileName = "npm"
  $pinfo.WorkingDirectory = $PROJECT
  $pinfo.RedirectStandardOutput = $true
  $pinfo.RedirectStandardError  = $true
  $pinfo.UseShellExecute = $false
  $pinfo.Arguments = "run check"

  $p = New-Object System.Diagnostics.Process
  $p.StartInfo = $pinfo
  [void]$p.Start()

  $stdout = $p.StandardOutput.ReadToEnd()
  $stderr = $p.StandardError.ReadToEnd()
  $p.WaitForExit()

  ($stdout + "`n" + $stderr) | Out-File -FilePath $logPath -Encoding UTF8
  return @{ exit = $p.ExitCode; text = ($stdout + "`n" + $stderr); log = $logPath }
}

function Write-Summary($success, $errMsg = "") {
  $sumPath = Join-Path $OUTDIR ("summary_{0}.txt" -f $DATE)
  $lines = @()
  $lines += ("Date: {0}" -f (Get-Date))
  $lines += ("Project: {0}" -f $PROJECT)
  $lines += ("Model: {0}" -f $MODEL)
  $lines += ("Success: {0}" -f $success)
  if ($errMsg) { $lines += ("Error: {0}" -f $errMsg) }
  $lines += ("Logs: {0}" -f $LOGDIR)
  $lines | Out-File -FilePath $sumPath -Encoding UTF8
  Write-Host ""
  Write-Host ("Resumo: {0}" -f $sumPath) -ForegroundColor Cyan
}

function Aider-FixGroup([string]$groupName, [string[]]$files, [string]$instructions) {
  $logName = "{0}_aider_{1}" -f $DATE, $groupName.Replace(" ","_")
  $logPath = Join-Path $LOGDIR ($logName + ".log")

  # monta args
  $args = @("--model", $MODEL, "--yes", "--no-pretty", "--message", $instructions)

  foreach ($f in $files) {
    $args += @("--file", $f)
  }

  Write-Host ""
  Write-Host "====================" -ForegroundColor Magenta
  Write-Host ("AIDER GROUP: {0}" -f $groupName) -ForegroundColor Magenta
  Write-Host ("FILES: {0}" -f ($files -join ", ")) -ForegroundColor Magenta
  Write-Host ("LOG : {0}" -f $logPath) -ForegroundColor Magenta
  Write-Host "====================" -ForegroundColor Magenta

  $pinfo = New-Object System.Diagnostics.ProcessStartInfo
  $pinfo.FileName = "aider"
  $pinfo.WorkingDirectory = $PROJECT
  $pinfo.RedirectStandardOutput = $true
  $pinfo.RedirectStandardError  = $true
  $pinfo.UseShellExecute = $false
  $pinfo.Arguments = ($args | ForEach-Object { 
    # quote argumentos que podem ter espaço
    if ($_ -match "\s") { '"' + $_.Replace('"','\"') + '"' } else { $_ }
  }) -join " "

  $p = New-Object System.Diagnostics.Process
  $p.StartInfo = $pinfo
  [void]$p.Start()

  $stdout = $p.StandardOutput.ReadToEnd()
  $stderr = $p.StandardError.ReadToEnd()
  $p.WaitForExit()

  ($stdout + "`n" + $stderr) | Out-File -FilePath $logPath -Encoding UTF8

  if ($p.ExitCode -ne 0) {
    throw ("Aider falhou no grupo: {0}" -f $groupName)
  }

  Write-Host ("Aider OK: {0}" -f $groupName) -ForegroundColor Green
}

# =========================
# GROUPS (SAFE ORDER)
# =========================
# Ajuste os paths se seu repo for diferente.
$GROUPS = @(
  @{
    name="Fix React getContext/useCartContext (bugs de import e API React)";
    files=@(
      "client/src/components/ui/input-otp.tsx",
      "client/src/components/ui/toggle-group.tsx",
      "client/src/contexts/ThemeContext.tsx",
      "client/src/hooks/useCart.ts"
    );
    msg=@"
Corrija usos incorretos de React.getContext/getContext.
- React NÃO tem getContext. Use useContext ou Context.Consumer.
- Ajuste imports (remover getContext do import).
- Em useCart.ts, corrigir import: usar CartContext + useContext (criar hook useCartContext se faltar).
- Objetivo: compilar sem erros TS nesses arquivos.
Não altere comportamento visual além do necessário.
"@
  },
  @{
    name="Fix toast API mismatch (useToast / toast signatures / toaster)";
    files=@(
      "client/src/components/PaymentMethodSelector.tsx",
      "client/src/components/ui/toaster.tsx",
      "client/src/pages/AdminAppearance.tsx",
      "client/src/pages/adminDishes/view/DishNutriTab.tsx",
      "client/src/pages/adminTheme/AdminThemeView.tsx",
      "client/src/pages/adminUsers/components/UserTabs/AddressesTab.tsx",
      "client/src/pages/adminUsers/components/UserTabs/SecurityTab.tsx"
    );
    msg=@"
Padronize o sistema de toast.
- Hoje toast() parece esperar string, mas está sendo chamado com objeto {title, description, variant}.
- Corrigir para o padrão existente do projeto (provável shadcn useToast: toast({ title, description, variant })).
- Em toaster.tsx, se useToast não expõe get(), adapte para usar `toasts` diretamente do hook (ou importe store correto).
- Tipar parâmetros (state, toast) para evitar implicit any.
Objetivo: remover erros TS relacionados a toast.
"@
  },
  @{
    name="Fix TRPC client router paths mismatch (csvOrders, ordersAdmin, usersAdmin, storeSettings, showcases)";
    files=@(
      "client/src/components/CSVOrdersList.tsx",
      "client/src/pages/adminOrders/components/OrderDetailsDrawer.tsx",
      "client/src/pages/adminOrders/components/orderDrawer/print/OrderPrintCenter.tsx",
      "client/src/pages/adminOrders/logic/useAdminOrderWizard.ts",
      "client/src/pages/adminOrders/view/AdminOrderCreate.tsx",
      "client/src/pages/adminOrders/view/steps/StepCustomer.tsx",
      "client/src/pages/adminSettings/components/InfrastructureCard.tsx",
      "client/src/pages/adminSettings/logic/useAccessibilityLogic.ts",
      "client/src/pages/adminSettings/logic/useAdminSettings.ts",
      "client/src/pages/adminSettings/logic/useCompanyInfo.ts",
      "client/src/pages/home/index.tsx",
      "client/src/pages/nutri/NutriRegister.tsx"
    );
    msg=@"
Corrija chamadas trpc.* que apontam para routers que não existem no AppRouter.
- Substituir trpc.csvOrders.* por rota existente (provável trpc.orders.*) ou criar alias no client se já existe no server.
- Substituir trpc.admin.ordersAdmin.* para o caminho correto no server (ex: trpc.admin.orders.* ou admin.orders.*).
- Substituir trpc.admin.usersAdmin.* para o caminho correto (ex: trpc.admin.users.*).
- Substituir trpc.admin.storeSettings.* para o caminho correto (ex: trpc.admin.settings.* ou trpc.settings.*).
- Substituir trpc.public.showcases.* se o router correto for outro.
NÃO inventar endpoints novos no client: siga os routers reais do server.
Objetivo: compilar sem TS2339 nesses arquivos.
"@
  },
  @{
    name="Fix role typing (AllowedRoles includes nutri)";
    files=@(
      "client/src/app/view/AppView.tsx",
      "client/src/components/ProtectedRoute.tsx"
    );
    msg=@"
Corrigir tipagem de roles.
- ProtectedRoute.requiredRole hoje aceita apenas 'admin'|'user', mas o sistema tem 'nutri'.
- Opção A (preferida): expandir tipo para incluir 'nutri'.
- Garantir que a lógica de permissão continue correta.
Objetivo: remover TS2322 em AppView.tsx.
"@
  },
  @{
    name="Fix schema imports cookie serialize / nutrition exports / drizzle types";
    files=@(
      "client/src/lib/auth.ts",
      "client/src/lib/nutrition.ts",
      "client/src/services/nutrition-sync.ts",
      "server/_core/sdk.ts",
      "server/routers/scripts/seed-taco.ts"
    );
    msg=@"
Corrigir imports quebrados:
- cookie: se serialize não existe no import nomeado, ajuste para `import cookie from 'cookie'` e use cookie.serialize, ou ajuste versão.
- drizzle/schema/nutrition: ajuste imports conforme exports reais (evitar productIngredients/ingredients inexistentes).
- server/_core/sdk.ts: import type User errado; deve vir do schema/gerados corretos (ou infer types do Drizzle).
- seed-taco.ts: ajuste import ingredients conforme schema real.
Objetivo: remover TS2305/TS2724/TS2339 relacionados a imports.
"@
  },
  @{
    name="Fix null vs undefined & type mismatches (AdminShipping, mailer, abandoned carts, addresses)";
    files=@(
      "client/src/pages/AdminAbandonedCarts.tsx",
      "client/src/pages/adminShipping/logic/useAdminShipping.ts",
      "client/src/pages/adminShipping/view/AdminShippingView.tsx",
      "server/routers/lib/mailer.ts",
      "client/src/pages/adminUsers/view/AdminUsersView.tsx"
    );
    msg=@"
Corrigir incompatibilidades de tipos, principalmente null vs undefined e propriedades faltantes:
- AbandonedCart: alinhar tipo do cart (incluir customerEmail, visitorId) ou ajustar funções para aceitar shape atual.
- Shipping: StoreSettings.pickupLabel/pickupInstruction aceitar null? padronizar pra string|undefined ou normalizar com ?? undefined.
- mailer.ts: masterLayout não deve ser null ao passar para parseTemplate; normalizar.
- AdminUsersView: garantir que `details` receba UserDetails|null, não undefined (usar data?.userDetails ?? null).
Objetivo: remover erros TS2322/TS2345/TS2339 nesses arquivos.
"@
  },
  @{
    name="Fix moduleResolution tailwind vite plugin";
    files=@(
      "vite.config.ts",
      "tsconfig.json"
    );
    msg=@"
Corrigir erro de moduleResolution para @tailwindcss/vite.
- Ajustar tsconfig para moduleResolution 'bundler' ou 'nodenext' compatível com Vite.
- Evitar quebrar build.
Objetivo: remover TS2307 em vite.config.ts.
"@
  }
)

# =========================
# MAIN
# =========================
try {
  Set-Location $PROJECT
  Ensure-Dir $OUTDIR
  Ensure-Dir $LOGDIR

  Write-Host "Night Aider Runner (Ollama)..." -ForegroundColor Cyan
  Write-Host ("Projeto: {0}" -f $PROJECT) -ForegroundColor Cyan
  Write-Host ("Modelo : {0}" -f $MODEL) -ForegroundColor Cyan

  # checkpoint inicial (se já não tiver)
  Git-Checkpoint ("checkpoint: before night aider {0}" -f $DATE)

  # 1) sanity: check inicial (captura)
  $cap = Get-TscErrorsText
  Write-Host ("TSC inicial exit={0}. Log: {1}" -f $cap.exit, $cap.log) -ForegroundColor DarkGray

  foreach ($g in $GROUPS) {
    $groupName = $g.name
    $files = $g.files
    $msg   = $g.msg

    Write-Host ""
    Write-Host ("=== GRUPO: {0} ===" -f $groupName) -ForegroundColor Yellow

    for ($pass=1; $pass -le $MAX_PASSES_PER_GROUP; $pass++) {
      Write-Host ("Pass {0}/{1}" -f $pass, $MAX_PASSES_PER_GROUP) -ForegroundColor Yellow

      Aider-FixGroup $groupName $files $msg

      # check
      $cap2 = Get-TscErrorsText
      Write-Host ("TSC exit={0}. Log: {1}" -f $cap2.exit, $cap2.log) -ForegroundColor DarkGray

      # commit se mudou algo
      Git-Checkpoint ("aider: {0} (pass {1}) {2}" -f $groupName, $pass, $DATE)

      if ($cap2.exit -eq 0) {
        Write-Host "✅ tsc passou! (Pode ainda haver lint/test)" -ForegroundColor Green
        break
      } else {
        # continua tentando dentro do grupo (até MAX)
        if ($pass -eq $MAX_PASSES_PER_GROUP) {
          throw ("TSC ainda falha após {0} passes no grupo: {1}" -f $MAX_PASSES_PER_GROUP, $groupName)
        }
      }
    }
  }

  # 2) check final + lint/test opcionais
  Run-Cmd "final_check" "npm" @("run","check") $false | Out-Null
  Run-Cmd "final_lint"  "npm" @("run","lint")  $true  | Out-Null
  Run-Cmd "final_test"  "npm" @("test")        $true  | Out-Null

  Write-Summary $truea
  Write-Host ""
  Write-Host "✅ Tudo OK. Night Aider finalizado." -ForegroundColor Green

  if ($SHUTDOWN_ON_SUCCESS) {
    Write-Host ("🔌 Desligando em {0}s..." -f $SHUTDOWN_DELAY_SEC) -ForegroundColor Yellow
    shutdown /s /t $SHUTDOWN_DELAY_SEC
  }
}
catch {
  $msg = $_.Exception.Message
  Write-Host ""
  Write-Host ("❌ Falhou: {0}" -f $msg) -ForegroundColor Red
  Write-Summary $false $msg
  Write-Host "🛑 NÃO vou desligar o PC, porque deu erro." -ForegroundColor Yellow
  exit 1
}