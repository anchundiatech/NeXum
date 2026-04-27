# 🚀 Nexum Pay

> **Infraestructura de pagos on-chain para empresas sobre Solana.**  
> Liquidaciones instantáneas, comisión automática y control total del flujo financiero.

---

## 🎯 ¿Qué es Nexum?

**Nexum** es un protocolo descentralizado que permite a empresas enviar y recibir pagos dentro de una red interna, gestionando balances, comisiones y transacciones completamente on-chain.
Empresa A → Nexum → Empresa B
↘ fee automático (0.3%)

💡 Es como un **Stripe interno descentralizado**, pero enfocado en **liquidaciones entre empresas**.

---

## ⚡ Características principales

- 💸 Transferencias instantáneas entre empresas  
- ⚙️ Comisión automática del **0.3%**  
- 🏢 Registro y gestión de empresas (CRUD completo)  
- 📊 Métricas globales del protocolo  
- 🔍 Historial de transacciones on-chain  
- 🔐 Control de permisos (owner / authority)  



## 🏗️ Arquitectura
```
┌──────────────┐
│ Protocolo    │
│ (config + KPIs)
└──────┬───────┘
│
▼
┌──────────────┐
│ Empresas     │
│ (balances)   │
└──────┬───────┘
│
▼
┌──────────────┐
│ Transacciones│
│ (historial)  │
└──────────────┘
```


## 🧠 ¿Cómo funciona?

### 1. Inicialización
Se crea el protocolo con:
- authority (admin)  
- fee fijo (0.3%)  
- métricas en cero  

### 2. Registro de empresas
Cada empresa:
- tiene un owner  
- mantiene su propio balance  
- queda registrada en el protocolo  

### 3. Flujo de dinero

- Una empresa deposita saldo  
- Otra empresa puede recibir pagos  
- Nexum procesa la transacción automáticamente  

### 4. En cada pago el sistema:

- valida saldo y estado  
- calcula comisión  
- transfiere monto neto  
- registra la transacción  
- actualiza métricas globales  

---

## 🔁 Operaciones del programa

### 🟢 CREATE

| Método | Descripción |
|--------|------------|
| `initialize` | Crea el protocolo |
| `register_empresa` | Registra una empresa |

---

### 🔵 READ

| Método | Descripción |
|--------|------------|
| `get_empresa` | Consulta información de una empresa |

---

### 🟡 UPDATE

| Método | Descripción |
|--------|------------|
| `update_empresa` | Actualiza nombre o país |

---

### 🔴 DELETE (Soft)

| Método | Descripción |
|--------|------------|
| `deactivate_empresa` | Desactiva empresa (solo admin) |

---

### ⚡ CORE (Pagos)

| Método | Descripción |
|--------|------------|
| `depositar` | Añade saldo a empresa |
| `liquidar_pago` | Ejecuta pago entre empresas con fee |

---

## 💸 Ejemplo real

Empresa A paga: 1000
Fee (0.3%): 3
Empresa B recibe: 997

✔ Todo ocurre en una sola transacción on-chain  

---

## 🧩 Estructura de cuentas

### 🧠 Protocolo

```rust
Protocolo {
  authority: Pubkey,
  nombre: String,
  fee_bps: u16,
  total_volume: u64,
  total_transacciones: u64,
  empresas: Vec<Pubkey>
}
```

🏢 Empresa

```rust
Empresa {
  owner: Pubkey,
  nombre: String,
  pais: String,
  balance: u64,
  total_enviado: u64,
  total_recibido: u64,
  activa: bool
}
📜 Transacción
Transaccion {
  origen: Pubkey,
  destino: Pubkey,
  monto: u64,
  fee: u64,
  monto_neto: u64,
  timestamp: i64,
  estado: EstadoTx
}
```

🔐 Seguridad y validaciones
❌ No permite montos cero
❌ Bloquea empresas inactivas
❌ Verifica saldo suficiente
❌ Restringe acciones por permisos
❌ Previene overflow con checked_*

## ⚙️ Tecnología

Solana
Anchor (Rust)
PDAs (Program Derived Addresses)
Rust
🛠️ Cómo ejecutar
yarn install
anchor build
anchor deploy
ts-node client.ts

## 🧪 Flujo de demo

El cliente:

crea protocolo
registra empresas
deposita balance
ejecuta pagos (liquidar_pago)
consulta estado (get_empresa)


## 🚀 Futuro
Stablecoin propia
SDK para empresas
Integración con sistemas tradicionales
Facturación automática
Pagos cross-chain

## 👨‍💻 Autor
Alejandro Anchundia 
Program ID: 8gkKQjfQHUZMPZqGMdRuuQoiSxmSqMnuG248LE8mcN2Q
Proyecto desarrollado para el bootcamp Solana Developer — WayLearn

```
Nexum — la capa de pagos para empresas en Web3
```

