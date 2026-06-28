# WSN Joalheria — Simulação Wokwi (G7-RESF)

Nó central (i) de uma rede de sensores sem fio para segurança de joalheria.
Simula, num único ESP32, o comportamento integrado dos nós da planta:
PIR + célula de carga + LDR + reed switch + buzzer, com **Edge Computing**
local e comunicação **MQTT** (topologia estrela single-hop).

---

## Como correr no VS Code (extensão Wokwi)

A extensão Wokwi não compila o código — ela só simula um binário já compilado.
Por isso usa-se o **PlatformIO** para compilar e o Wokwi para simular.

### 1. Instalar a extensão PlatformIO IDE
No VS Code: separador *Extensions* → procurar **PlatformIO IDE** → Install.
(Já tens a *Wokwi Simulator* instalada e licenciada.)

### 2. Abrir a pasta do projeto
`File → Open Folder…` → escolher a pasta `joalheria-wokwi`.

### 3. Compilar (Build)
PlatformIO → ícone do alien na barra lateral → **Build**
(ou na barra de baixo, o ✓). Isto gera `.pio/build/esp32dev/firmware.bin`.
A primeira compilação descarrega a toolchain do ESP32 (demora 2–5 min).

### 4. Iniciar a simulação
Abrir `diagram.json` e clicar no botão **▶ (play)** verde que a extensão Wokwi
coloca no canto, **ou** premir `F1` → *Wokwi: Start Simulator*.

---

## Como testar (passo a passo para o relatório / vídeo)

1. Espera o Serial Monitor mostrar `Wi-Fi OK` e `A ligar ao broker MQTT... OK`.
2. Clica no **botão verde (Armar)** → o sistema entra em modo nocturno
   (captura o peso e a luz de base).
3. Mexe o **potenciómetro** (= remoção de peça da vitrine) → evento de peso.
4. Clica no **sensor PIR** para simular movimento → presença detectada.
5. Com PIR + potenciómetro mexido + sistema armado →
   **ALARME IMPLÍCITO** (buzzer + LED a piscar) — é a regra de correlação.
6. Clica no **botão vermelho (Porta)** com o sistema armado → alarme de intrusão.
7. Tapa/destapa o **LDR** → variação de luz (lanterna).

## Monitorizar o MQTT (a "central remota")

Os eventos são publicados em `broker.hivemq.com`. Para ver/comandar:
- Abrir <https://www.hivemq.com/demos/websocket-client/>
- Connect → Subscribe ao tópico `joalheria/g7resf/#`
- Para o **alarme explícito** (operador remoto): Publish no tópico
  `joalheria/g7resf/comando` com a mensagem `ALARME` (ou `ARMAR`, `DESARMAR`, `SILENCIAR`).

> Isto demonstra os dois tipos de alarme do trabalho: o **implícito**
> (gerado pelo Edge Computing) e o **explícito** (accionado por MQTT remoto).

---

## Tópicos MQTT

| Tópico                       | Conteúdo                          |
|------------------------------|-----------------------------------|
| `joalheria/g7resf/pir`       | presença / movimento              |
| `joalheria/g7resf/peso`      | célula de carga (remoção de peça) |
| `joalheria/g7resf/luz`       | LDR (variação de luminosidade)    |
| `joalheria/g7resf/porta`     | reed switch (abertura de porta)   |
| `joalheria/g7resf/alarme`    | alarmes implícito/explícito       |
| `joalheria/g7resf/status`    | heartbeat / estado (fiabilidade)  |
| `joalheria/g7resf/comando`   | **entrada** de comandos remotos   |

## Ligações (GPIO)

| Componente            | Pino ESP32 |
|-----------------------|------------|
| PIR (OUT)             | 13         |
| LDR (AO)              | 34         |
| Célula de carga (pot) | 35         |
| Reed switch (porta)   | 14         |
| Botão armar           | 27         |
| Buzzer                | 26         |
| LED                   | 2          |
| OLED SDA / SCL        | 21 / 22    |
