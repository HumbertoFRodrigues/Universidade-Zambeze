/*
 * ============================================================
 *  PROJECTO : Rede de Sensores Sem Fio (WSN) para Joalheria
 *  CADEIRA  : Redes Sem Fio - Universidade Zambeze (FCT)
 *  AUTOR    : G7-RESF
 *  NO       : No Central (i) - Edge Computing + Gateway MQTT
 * ============================================================
 *  Este firmware simula, num unico ESP32, o comportamento
 *  integrado dos nos sensores da joalheria (Capitulo IV).
 *  Combina as 3 camadas de seguranca descritas no trabalho:
 *    - Camada fisica   : celula de carga (peso) + LDR (luz)
 *    - Camada presenca : PIR (movimento) + reed switch (porta)
 *    - Camada logica   : Edge Computing (correlacao de eventos)
 *
 *  LIGACOES (ver diagram.json):
 *    PIR  (presenca) ............ GPIO 13
 *    LDR  (luminosidade) ........ GPIO 34 (ADC)
 *    Celula de carga (peso) ..... GPIO 35 (ADC) -> potenciometro
 *    Reed switch (porta) ........ GPIO 14 -> botao vermelho
 *    Botao ARMAR / DESARMAR ..... GPIO 27 -> botao verde
 *    Buzzer (alarme sonoro) ..... GPIO 26
 *    LED (alarme visual) ........ GPIO  2
 *    Display OLED I2C ........... SDA 21 / SCL 22
 *
 *  COMUNICACAO: Wi-Fi -> MQTT (topologia estrela single-hop)
 * ============================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// ---------------- Configuracao de rede ----------------
const char* WIFI_SSID    = "Wokwi-GUEST";
const char* WIFI_PASS    = "";
const char* MQTT_BROKER  = "broker.hivemq.com";   // broker publico (funciona no Wokwi)
const int   MQTT_PORT    = 1883;
const char* MQTT_CLIENT  = "joalheria-g7resf-no-i";

// ---------------- Topicos MQTT ----------------
const char* T_PIR     = "joalheria/g7resf/pir";
const char* T_PESO    = "joalheria/g7resf/peso";
const char* T_LUZ     = "joalheria/g7resf/luz";
const char* T_PORTA   = "joalheria/g7resf/porta";
const char* T_ALARME  = "joalheria/g7resf/alarme";
const char* T_STATUS  = "joalheria/g7resf/status";
const char* T_COMANDO = "joalheria/g7resf/comando";   // recebe ordens do operador remoto

// ---------------- Pinos ----------------
#define PIN_PIR    13
#define PIN_LDR    34
#define PIN_PESO   35
#define PIN_PORTA  14
#define PIN_ARM    27
#define PIN_BUZZER 26
#define PIN_LED     2

// ---------------- OLED ----------------
#define OLED_W 128
#define OLED_H 64
Adafruit_SSD1306 display(OLED_W, OLED_H, &Wire, -1);
bool oledOk = false;

// ---------------- Limiares de Edge Computing ----------------
const int LIMIAR_PESO = 300;   // variacao ADC ~ remocao de peca
const int LIMIAR_LUZ  = 800;   // variacao ADC ~ lanterna / abertura de vitrine

// ---------------- Estado global ----------------
WiFiClient   wifiClient;
PubSubClient mqtt(wifiClient);

bool sistemaArmado = false;   // modo nocturno / loja fechada
bool alarmeActivo  = false;
int  pesoBase = 0;            // baseline capturado ao armar
int  luzBase  = 0;

// estados anteriores (deteccao de transicoes)
bool pirAnt    = false;
bool portaAnt  = false;
bool remocaoAnt = false;
bool luzAnt    = false;
bool armBtnAnt = HIGH;

unsigned long tHeartbeat = 0;
unsigned long tLeitura   = 0;
unsigned long tBuzzer    = 0;
bool buzzerLigado = false;

// ====================================================
//  Funcoes auxiliares
// ====================================================
void publicar(const char* topico, const char* nivel, const char* evento, int valor) {
  JsonDocument doc;
  doc["no"]     = "i";
  doc["nivel"]  = nivel;          // INFO | ALERTA | CRITICO
  doc["evento"] = evento;
  doc["valor"]  = valor;
  doc["armado"] = sistemaArmado;
  doc["ts"]     = millis();
  char buffer[256];
  serializeJson(doc, buffer);
  mqtt.publish(topico, buffer);
  Serial.printf("[MQTT -> %s] %s\n", topico, buffer);
}

void mostrarOLED(const char* linha1, const char* linha2) {
  if (!oledOk) return;
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("WSN JOALHERIA G7-RESF");
  display.drawLine(0, 10, 127, 10, SSD1306_WHITE);
  display.setCursor(0, 16);
  display.print("Estado: ");
  display.println(alarmeActivo ? "!! ALARME !!" : (sistemaArmado ? "ARMADO" : "desarmado"));
  display.setCursor(0, 32);
  display.println(linha1);
  display.setCursor(0, 44);
  display.println(linha2);
  display.setCursor(0, 56);
  display.print("MQTT: ");
  display.println(mqtt.connected() ? "online" : "offline");
  display.display();
}

void armarSistema() {
  sistemaArmado = true;
  alarmeActivo  = false;
  pesoBase = analogRead(PIN_PESO);
  luzBase  = analogRead(PIN_LDR);
  noTone(PIN_BUZZER);
  digitalWrite(PIN_LED, LOW);
  publicar(T_STATUS, "INFO", "Sistema ARMADO (modo nocturno)", 0);
}

void desarmarSistema() {
  sistemaArmado = false;
  alarmeActivo  = false;
  noTone(PIN_BUZZER);
  digitalWrite(PIN_LED, LOW);
  publicar(T_STATUS, "INFO", "Sistema DESARMADO", 0);
}

// callback MQTT -> comandos do operador remoto (alarme explicito)
void callback(char* topic, byte* payload, unsigned int length) {
  String cmd;
  for (unsigned int i = 0; i < length; i++) cmd += (char)payload[i];
  cmd.trim(); cmd.toUpperCase();
  Serial.printf("[MQTT <- %s] %s\n", topic, cmd.c_str());

  if      (cmd == "ARMAR")     armarSistema();
  else if (cmd == "DESARMAR")  desarmarSistema();
  else if (cmd == "SILENCIAR") { alarmeActivo = false; noTone(PIN_BUZZER); digitalWrite(PIN_LED, LOW); }
  else if (cmd == "ALARME") {                          // alarme EXPLICITO (operador)
    alarmeActivo = true;
    publicar(T_ALARME, "CRITICO", "Alarme explicito accionado pelo operador remoto", 0);
  }
}

// ====================================================
//  Conexoes
// ====================================================
void conectarWifi() {
  Serial.printf("A ligar ao Wi-Fi %s ", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) { delay(250); Serial.print("."); }
  Serial.printf("\nWi-Fi OK. IP: %s\n", WiFi.localIP().toString().c_str());
}

void conectarMqtt() {
  while (!mqtt.connected()) {
    Serial.print("A ligar ao broker MQTT...");
    if (mqtt.connect(MQTT_CLIENT)) {
      Serial.println(" OK");
      mqtt.subscribe(T_COMANDO);
      publicar(T_STATUS, "INFO", "No central (i) online - gateway/edge activo", 0);
    } else {
      Serial.printf(" falhou (rc=%d). Nova tentativa em 2s\n", mqtt.state());
      delay(2000);
    }
  }
}

// ====================================================
//  Edge Computing - leitura + correlacao de eventos
// ====================================================
void aplicarEdge() {
  bool pir    = digitalRead(PIN_PIR);
  int  luz    = analogRead(PIN_LDR);
  int  peso   = analogRead(PIN_PESO);
  bool porta  = (digitalRead(PIN_PORTA) == LOW);   // botao premido = porta aberta

  bool remocao = (abs(peso - pesoBase) > LIMIAR_PESO);
  bool varLuz  = (abs(luz  - luzBase)  > LIMIAR_LUZ);

  // ---- PORTA (reed switch) ----
  if (porta != portaAnt) {
    if (porta) {
      publicar(T_PORTA, sistemaArmado ? "CRITICO" : "INFO", "Porta aberta", 1);
      if (sistemaArmado) { alarmeActivo = true; publicar(T_ALARME, "CRITICO", "Intrusao: porta aberta com sistema armado", 1); }
    } else {
      publicar(T_PORTA, "INFO", "Porta fechada", 0);
    }
    portaAnt = porta;
  }

  // ---- PIR (presenca) ----
  if (pir != pirAnt) {
    publicar(T_PIR, (sistemaArmado && pir) ? "ALERTA" : "INFO",
             pir ? "Movimento detectado" : "Sem movimento", pir ? 1 : 0);
    pirAnt = pir;
  }

  // ---- CELULA DE CARGA (remocao de peca) ----
  if (remocao != remocaoAnt) {
    if (remocao) publicar(T_PESO, sistemaArmado ? "CRITICO" : "ALERTA", "Variacao de peso: peca removida/deslocada", peso);
    else         publicar(T_PESO, "INFO", "Peso normalizado", peso);
    remocaoAnt = remocao;
  }

  // ---- LDR (variacao de luz: lanterna / abertura de vitrine) ----
  if (varLuz != luzAnt) {
    if (varLuz) publicar(T_LUZ, sistemaArmado ? "ALERTA" : "INFO", "Variacao brusca de luminosidade", luz);
    luzAnt = varLuz;
  }

  // ---- CORRELACAO (alarme IMPLICITO) ----
  // Regra do trabalho: PIR activo + variacao de peso, em periodo nocturno -> ameaca real
  if (sistemaArmado && pir && remocao && !alarmeActivo) {
    alarmeActivo = true;
    publicar(T_ALARME, "CRITICO", "ALARME IMPLICITO: presenca + remocao de peca em periodo nocturno", peso);
  }

  // ---- OLED ----
  char l1[24], l2[24];
  snprintf(l1, sizeof(l1), "PIR:%d Porta:%d", pir, porta);
  snprintf(l2, sizeof(l2), "Luz:%d Peso:%d", luz, peso);
  mostrarOLED(l1, l2);
}

// ====================================================
//  Setup / Loop
// ====================================================
void setup() {
  Serial.begin(115200);
  delay(300);

  pinMode(PIN_PIR, INPUT);
  pinMode(PIN_PORTA, INPUT_PULLUP);
  pinMode(PIN_ARM, INPUT_PULLUP);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_LED, OUTPUT);
  digitalWrite(PIN_LED, LOW);
  tone(PIN_BUZZER, 1); delay(2); noTone(PIN_BUZZER);   // inicializa o LEDC do buzzer (evita erro e bip preso)

  Wire.begin(21, 22);
  oledOk = display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  if (oledOk) { display.clearDisplay(); display.display(); }

  pesoBase = analogRead(PIN_PESO);
  luzBase  = analogRead(PIN_LDR);

  conectarWifi();
  mqtt.setServer(MQTT_BROKER, MQTT_PORT);
  mqtt.setCallback(callback);
  conectarMqtt();
}

void loop() {
  if (!mqtt.connected()) conectarMqtt();
  mqtt.loop();

  unsigned long agora = millis();

  // botao fisico ARMAR/DESARMAR (flanco de descida)
  bool armBtn = digitalRead(PIN_ARM);
  if (armBtnAnt == HIGH && armBtn == LOW) {
    if (sistemaArmado) desarmarSistema(); else armarSistema();
    delay(200); // debounce simples
  }
  armBtnAnt = armBtn;

  // leitura + edge a cada 200 ms
  if (agora - tLeitura >= 200) { tLeitura = agora; aplicarEdge(); }

  // heartbeat a cada 10 s (fiabilidade - seccao 5.2)
  if (agora - tHeartbeat >= 10000) {
    tHeartbeat = agora;
    publicar(T_STATUS, "INFO", "heartbeat", WiFi.RSSI());
  }

  // accionamento do alarme (buzzer intermitente + LED a piscar)
  if (alarmeActivo) {
    if (agora - tBuzzer >= 350) {
      tBuzzer = agora;
      buzzerLigado = !buzzerLigado;
      digitalWrite(PIN_LED, buzzerLigado);
      tone(PIN_BUZZER, buzzerLigado ? 2800 : 1800);   // sirene de duas notas
    }
  }
}
