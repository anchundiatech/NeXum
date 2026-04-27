# 🚀 Nexum Pay

![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)
![Solana](https://img.shields.io/badge/Solana-9945FF?style=for-the-badge&logo=solana&logoColor=white)
![Anchor](https://img.shields.io/badge/Anchor-2F2F2F?style=for-the-badge&logo=anchor&logoColor=white)
![Nexum](https://img.shields.io/badge/Nexum-Pay-6C2BD9?style=for-the-badge&logo=web3.js&logoColor=white)

> **Infraestructura de pagos on-chain para empresas sobre Solana.**  
> Liquidaciones instantáneas, comisión automática y control total del flujo financiero.

---

## 🎯 ¿Qué es Nexum?
<img width="1068" height="688" alt="image" src="https://github.com/user-attachments/assets/196df450-2b7d-4c2f-a0c4-bba9a4a695e3" />

**Nexum** es un protocolo descentralizado que permite a empresas enviar y recibir pagos dentro de una red interna, gestionando balances, comisiones y transacciones completamente on-chain.
Empresa A → Nexum → Empresa B
↘ fee automático (0.3%)

💡 Es como un **Stripe interno descentralizado**, pero enfocado en **liquidaciones entre empresas**.

---
## Registro y deposito
<img width="1110" height="685" alt="image" src="https://github.com/user-attachments/assets/3c7be538-bc75-4ca6-8079-b3319330fa43" />
<img width="1207" height="676" alt="image" src="https://github.com/user-attachments/assets/e8d4e0ce-20e9-4b65-9218-c416c35a6fb8" />
<img width="1205" height="690" alt="image" src="https://github.com/user-attachments/assets/f800513e-094b-4ef8-8a82-5da93fdd73ef" />




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

