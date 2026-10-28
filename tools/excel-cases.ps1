<#
.SYNOPSIS
  Udtrækker kontrolcases fra regnearket til tests/cases/excel-cases.json.

.DESCRIPTION
  Kræver Windows med Microsoft Excel. Regnearket kopieres til en midlertidig fil, som åbnes
  skrivebeskyttet i en separat Excel-instans; originalen ændres aldrig. For hver case sættes
  inddatacellerne, arket genberegnes, og alle resultatceller fra docs/EXCEL_KORTLAEGNING.md aflæses.
  Regnearket ligger i den lokale mappe »Data og dokumentation« og kommer ikke i Git.

.EXAMPLE
  pwsh tools/excel-cases.ps1 -Regneark "Data og dokumentation/Opdriftsikring rør - X-GRID 1026 - WIP.xlsx"
#>
param(
  [Parameter(Mandatory)] [string] $Regneark,
  [string] $Ud = (Join-Path $PSScriptRoot '..' 'tests' 'cases' 'excel-cases.json')
)
$ErrorActionPreference = 'Stop'

# Inddata: appens navn → celle i arket »Rapporten«.
$inputCeller = [ordered]@{
  d = 'F123'; h1 = 'F121'; gvs = 'F122'; roervaegt = 'D148'
  gamma = 'C157'; gammaTor = 'C158'; phi = 'C159'; gammaF = 'E92'
}

# Resultatceller med kortlægningens betegnelser.
$resultatCeller = [ordered]@{
  C8 = 'Rørdiameter i projektbeskrivelsen'; C9 = 'Jorddækning i projektbeskrivelsen'
  C10 = 'GVS i projektbeskrivelsen'
  B123 = 'T3'; F157 = 'gamma_d'; F158 = 'gamma_tør,d'; F159 = 'phi_d'; D149 = 'E_rør,d (kg/m)'
  C286 = "gamma'_d"; G133 = 'O'; G145 = 'B'; E167 = 'S1'; H167 = 'S1 OK/EJ OK'
  A169 = 'Konklusion, linje 1'; A170 = 'Konklusion, linje 2'; G177 = 'F_opdrift'
  G207 = 'UTS'; G199 = 'Geonet'; G213 = 'RF'; G229 = 'P_till'; E238 = 'P_till/F_opdrift'
  H238 = 'Geonet OK/EJ OK'; C285 = 'h_bund'; E285 = 'h_top'; C289 = 'F_bund'; E289 = 'F_top'
  F299 = 'K'; G312 = 'A: 2L (vist)'; C315 = 'A: L'; B319 = 'A: L_a'; B320 = 'A: L_geonet,tot'
  A333 = 'A: ballast + forankring'; E333 = 'A: kontrol'; H333 = 'A: OK/EJ OK'
  E363 = "B: sigma'_v"; G363 = 'B: 2L_mellem (beregnet)'; C366 = 'B: 2L_mellem'; C369 = 'B: L'
  B384 = 'B: L_a'; B385 = 'B: L_geonet,tot'; G404 = 'C: 2L'; C407 = 'C: L'; B411 = 'C: L_a'
  B412 = 'C: L_geonet,tot'; A427 = 'C: ballast + forankring'; E427 = 'C: kontrol'
  H427 = 'C: OK/EJ OK'; C452 = 'D: 2L_mellem'; C455 = 'D: L'; B469 = 'D: L_a'
  B470 = 'D: L_geonet,tot'
}

# Tal i casenavne med dansk decimalkomma, fx 0,4.
function Tal([double] $x) { $x.ToString('0.0##', [cultureinfo] 'da-DK') }

function Case($navn, $d, $h1, [hashtable] $ekstra = @{}) {
  $inddata = [ordered]@{
    d = $d; h1 = $h1; gvs = 0.0; roervaegt = 340.0; gamma = 17.0; gammaTor = 16.0; phi = 35.0
    konsekvensklasse = 'CC2'; overstyring = $null
  }
  foreach ($k in $ekstra.Keys) { $inddata[$k] = $ekstra[$k] }
  [ordered]@{ navn = $navn; input = $inddata }
}

$cases = @(
  Case 'Case 1: arkets gemte værdier' 2.5 1.5
  Case 'Case 2: Ø4000 med 2 lag X-GRID 150' 4.0 0.6 @{ overstyring = [ordered]@{ uts = 150; lag = 2 } }
  Case 'Case 2 uden overstyring: kontakt leverandør' 4.0 0.6
  Case 'Overstyring til 1 lag X-GRID 110' 2.5 1.5 @{ overstyring = [ordered]@{ uts = 110; lag = 1 } }
)
foreach ($d in 0.4, 1.0, 1.6, 2.0, 3.0) {
  foreach ($h1 in 0.3, 1.0, 2.0) { $cases += Case "Gitter: d = $(Tal $d) m, h1 = $(Tal $h1) m" $d $h1 }
}
$cases += @(
  Case 'K-03: bånd for X-GRID 35' 1.919 1.0
  Case 'K-03: bånd for X-GRID 55' 2.253 1.0
  Case 'K-03: bånd for X-GRID 80' 2.601 1.0
  Case 'K-03: bånd for X-GRID 110' 2.96 1.0
  Case 'K-03: bånd for X-GRID 150' 3.372 1.0
  Case 'K-02: grænsen 78,9 for X-GRID 150' 3.457 1.0
  Case 'Over grænsen: kontakt leverandør' 3.54 1.0
)
foreach ($gvs in 0.5, 1.0, 1.5, 2.0, 2.75, 3.5, 4.5) {
  $cases += Case "GVS i $(Tal $gvs) m (d = 2,5 m, h1 = 1,5 m)" 2.5 1.5 @{ gvs = $gvs }
}
$cases += @(
  Case 'Rørvægt 0 kg/m' 2.5 1.5 @{ roervaegt = 0.0 }
  Case 'Rørvægt 1500 kg/m' 2.5 1.5 @{ roervaegt = 1500.0 }
  Case 'Fyld: 18/17 kN/m3, 32°' 2.5 1.5 @{ gamma = 18.0; gammaTor = 17.0; phi = 32.0 }
  Case 'Fyld: 20/18 kN/m3, 38°' 2.5 1.5 @{ gamma = 20.0; gammaTor = 18.0; phi = 38.0 }
  Case 'Friktionsvinkel 30°' 2.5 1.5 @{ phi = 30.0 }
  Case 'Friktionsvinkel 40°' 2.5 1.5 @{ phi = 40.0 }
  Case 'CC1: case 1' 2.5 1.5 @{ konsekvensklasse = 'CC1' }
  Case 'CC3: case 1' 2.5 1.5 @{ konsekvensklasse = 'CC3' }
  Case 'CC3: case 2 med 2 lag X-GRID 150' 4.0 0.6 @{
    konsekvensklasse = 'CC3'; overstyring = [ordered]@{ uts = 150; lag = 2 }
  }
)

# Arkets fejlværdier kommer gennem COM som heltal.
$fejl = @{
  -2146826281 = '#DIV/0!'; -2146826246 = '#N/A'; -2146826259 = '#NAME?'; -2146826288 = '#NULL!'
  -2146826252 = '#NUM!'; -2146826265 = '#REF!'; -2146826273 = '#VALUE!'
}
function Vaerdi($celle) {
  $v = $celle.Value2
  if ($v -is [int] -and $fejl.ContainsKey($v)) { return $fejl[$v] }
  if ($v -is [string] -and $v -eq '') { return $null }
  return $v
}

$kilde = (Resolve-Path -LiteralPath $Regneark).Path
$kopi = Join-Path ([IO.Path]::GetTempPath()) ("opdrift-excel-cases-" + [guid]::NewGuid() + '.xlsx')
Copy-Item -LiteralPath $kilde -Destination $kopi
$excel = $null; $wb = $null; $egenInstans = $false
try {
  $excel = New-Object -ComObject Excel.Application
  # En ny instans har ingen åbne projektmapper. Ellers er det brugerens Excel, som ikke må røres.
  if ($excel.Workbooks.Count -ne 0) {
    $excel = $null
    throw 'Fik forbindelse til en kørende Excel med åbne projektmapper. Intet er ændret.'
  }
  $egenInstans = $true
  $excel.Visible = $false
  $excel.DisplayAlerts = $false
  $wb = $excel.Workbooks.Open($kopi, 0, $true)
  $ws = $wb.Worksheets.Item('Rapporten')
  $navne = $wb.Worksheets.Item('Navne tabel')
  $oprindelig = @{ G207 = $ws.Range('G207').Formula; G199 = $ws.Range('G199').Formula }

  $resultater = foreach ($c in $cases) {
    $i = $c.input
    foreach ($k in 'd', 'h1', 'gvs', 'roervaegt', 'gamma', 'gammaTor', 'phi') {
      $ws.Range($inputCeller[$k]).Value2 = [double] $i[$k]
    }
    # γ_f = 1,1 · K_FI (DS/EN 1997-1 DK NA:2021, A.1 og tabel A.4-1 NA).
    $ws.Range('E92').Value2 = if ($i.konsekvensklasse -eq 'CC3') { 1.21 } else { 1.1 }
    $ws.Range('G207').Formula = $oprindelig.G207
    $ws.Range('G199').Formula = $oprindelig.G199
    if ($i.overstyring) {
      # Som case 2 i arket: UTS og navn skrives ind over formlerne.
      $ws.Range('G207').Value2 = [double] ($i.overstyring.uts * $i.overstyring.lag)
      $ws.Range('G199').Value2 = "$($i.overstyring.uts) ($($i.overstyring.lag) lag)"
    }
    $excel.CalculateFull()
    $excelVaerdier = [ordered]@{}
    foreach ($celle in $resultatCeller.Keys) { $excelVaerdier[$celle] = Vaerdi $ws.Range($celle) }
    [ordered]@{ navn = $c.navn; input = $i; excel = $excelVaerdier }
  }

  $graenser = [ordered]@{}
  foreach ($col in 'G', 'H', 'I', 'J', 'K') {
    $graenser[[string] (Vaerdi $navne.Range("${col}22"))] = Vaerdi $navne.Range("${col}44")
  }
  $data = [ordered]@{
    kilde = [ordered]@{
      fil = Split-Path -Leaf $kilde
      ark = 'Rapporten'
      udtrukket = (Get-Date -Format 'yyyy-MM-dd')
      excel = $excel.Version
      vaerktoej = 'tools/excel-cases.ps1'
    }
    inputCeller = $inputCeller
    resultatCeller = $resultatCeller
    navneTabel = [ordered]@{ RF = Vaerdi $navne.Range('C44'); graenser = $graenser }
    cases = @($resultater)
  }
  $json = ($data | ConvertTo-Json -Depth 10) -replace "`r`n", "`n"
  New-Item -ItemType Directory -Force (Split-Path $Ud) | Out-Null
  [IO.File]::WriteAllText($Ud, $json + "`n", (New-Object Text.UTF8Encoding $false))
  Write-Output "$(@($resultater).Count) cases skrevet til $Ud"
}
finally {
  if ($wb) { $wb.Close($false) }
  if ($excel -and $egenInstans) {
    $excel.Quit()
    [void][Runtime.InteropServices.Marshal]::ReleaseComObject($excel)
    # Excel-processen lukker først, når alle COM-referencer er frigivet.
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
  }
  Remove-Item -LiteralPath $kopi -ErrorAction SilentlyContinue
}
