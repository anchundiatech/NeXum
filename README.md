# 🚀 Nexum Pay

> **Pasarela de pagos global sobre Solana usando SPL tokens.**
> Pagos instantáneos, comisiones mínimas y liquidación en segundos.

---

## 🎯 Qué es Nexum

**Nexum** es un protocolo on-chain que permite procesar pagos digitales entre usuarios y comerciantes utilizando tokens en Solana.

```
Usuario paga → Nexum procesa → Merchant recibe → Fee automático
```

💡 Inspirado en Stripe / PayPal pero descentralizado.

---

## ⚡ Características

* 💸 Pagos instantáneos con SPL Tokens
* ⚙️ Comisión configurable (basis points)
* 🛍️ Registro de comerciantes
* 📊 Tracking de volumen y transacciones
* 🔍 Transparencia total on-chain

---

## 🏗️ Arquitectura

```
┌──────────────┐
│   Usuario    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Vault      │ (SPL Tokens)
└──────┬───────┘
       │ Transfer
       ▼
┌──────────────┐
│  Merchant    │
└──────────────┘
```

---

## 🧠 Cómo funciona

1. Se inicializa el protocolo
2. Se registra un comerciante
3. Se crean tokens (SPL)
4. Usuario deposita (pago)
5. El contrato:

   * cobra fee
   * envía monto neto
   * registra la transacción

---

## 📦 Instrucciones del programa

| Instrucción          | Descripción           |
| -------------------- | --------------------- |
| `initialize`         | Crea el protocolo     |
| `registerMerchant`   | Registra comerciante  |
| `deposit`            | Ejecuta pago con fee  |
| `transfer`           | Transferencia directa |
| `deactivateMerchant` | Desactiva merchant    |

---

## 💸 Ejemplo real

```
🚀 Nexum Demo
⚙️ Inicializando protocolo...
✅ Protocolo creado
🛍️ Registrando merchant...
✅ Merchant registrado
💸 Ejecutando pago...
✅ Pago realizado
📊 Resultado:
Total recibido: 997
```

👉 Pago: `1000`
👉 Fee: `0.3% = 3`
👉 Merchant recibe: `997`

---

## 🪙 Tecnología

* **Solana** — blockchain rápida
* **Anchor** — framework Rust
* **SPL Tokens** — manejo de pagos
* **PDAs** — cuentas determinísticas

---

## 🛠️ Cómo ejecutar

### 1. Instalar dependencias

```bash
yarn install
```

### 2. Build

```bash
anchor build
```

### 3. Deploy

```bash
anchor deploy
```

### 4. Ejecutar demo

```bash
ts-node client.ts
```

---

## 🧪 Flujo de demo

El cliente hace:

* crea mint
* crea vault
* crea cuenta merchant
* mintea tokens
* ejecuta `deposit`

---

## 🧩 Estructura de cuentas

```rust
Protocol {
  authority: Pubkey,
  fee_bps: u16,
  total_volume: u64,
  total_transactions: u64
}

Merchant {
  owner: Pubkey,
  nombre: String,
  red_pago: String,
  total_recibido: u64,
  activo: bool
}

Transaction {
  from: Pubkey,
  to: Pubkey,
  monto: u64,
  fee: u64,
  red_origen: String,
  timestamp: i64,
  estado: EstadoTx
}
```

---

## 📈 Roadmap

### Fase 1 (Bootcamp)

* ✅ Core del protocolo
* ✅ Pagos SPL funcionales

### Fase 2

* 🔄 Vault con PDA
* 🔄 Multi-merchant real

### Fase 3

* 🌎 Integración con APIs de pago reales
* 🌎 Expansión internacional

---

## 🏆 Qué lograste

✔ Sistema de pagos funcional
✔ Fee automático
✔ Transferencia real en blockchain
✔ Arquitectura escalable

👉 Esto ya es un **MVP de pasarela de pago global**

---

## 🚀 Futuro

* Stablecoin propia
* Dashboard web
* SDK para empresas
* Integración con Stripe / Wise

---

## 👨‍💻 Autor

Proyecto desarrollado para el bootcamp **Solana Developer — WayLearn**

---

> Nexum — pagos sin fronteras.
