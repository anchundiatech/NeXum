# Nexum Protocol

> *Del latín connexio — conexión. El protocolo que une los sistemas de pago 
> de Latinoamérica sobre Solana.*

## El problema

Latinoamérica tiene decenas de sistemas de pago fragmentados — Cobro, PayPhone,
Nequi, Yape, Mercado Pago — y ninguno habla con el otro. Un comerciante en Ecuador
no puede recibir un pago de alguien en Colombia sin perder entre 5% y 8% en
comisiones y conversiones. El dinero en Latam está atrapado en islas.

El sistema financiero tradicional tarda días, cobra fortunas y opera solo en
horario bancario. Solana puede liquidar una transacción en 400ms por $0.001.
Esa brecha es la oportunidad.

**Nexum es el puente.**

## La solución

Un protocolo descentralizado sobre Solana que permite:

- Registrar comerciantes y sus redes de pago nativas
- Procesar depósitos desde cualquier sistema de pago externo
- Transferir valor entre wallets instantáneamente
- Liquidar pagos con una comisión de 0.3% — 20x más barato que el promedio actual
- Auditar cada transacción públicamente en la blockchain

El usuario final nunca necesita saber que está usando blockchain.
Solo ve que su pago llegó en segundos.

## Tecnologías

- **Solana** — red de liquidación de alta velocidad y bajo costo
- **Anchor Framework** — desarrollo del programa en Rust
- **SPL Tokens** — token NEXUM como unidad de valor del protocolo
- **PDAs** — almacenamiento descentralizado de comerciantes y transacciones

## Arquitectura del protocolo


```

[Usuario final]
│
├── Paga con Cobro / PayPhone / Mercado Pago
│                    │
│                    ▼
│          [Gateway de Nexum]
│                    │
│                    ▼
│       [Programa Anchor en Solana]
│                    │
│         ┌──────────┴──────────┐
│         ▼                     ▼
│   Token NEXUM            PDA Transacción
│   (stablecoin)           { origen, destino,
│                            monto, estado }
│                    │
└── Recibe en cualquier wallet o red destino

```

## Instrucciones del programa

| Instrucción | Descripción |
|---|---|
| `initialize` | Inicializa el protocolo con su authority y fee |
| `register_merchant` | Registra un comerciante y su red de pago nativa |
| `deposit` | Convierte un pago externo en tokens NEXUM |
| `transfer` | Transfiere tokens NEXUM entre wallets |
| `deactivate_merchant` | Desactiva un comerciante (solo authority) |

## Estructura de cuentas (PDAs)

```rust
// Cuenta del protocolo
Protocol {
    authority: Pubkey,        // administrador del protocolo
    fee_bps: u16,             // comisión en basis points (30 = 0.3%)
    total_volume: u64,        // volumen total procesado
    total_transactions: u64,  // número total de transacciones
}

// Cuenta de comerciante
Merchant {
    owner: Pubkey,            // wallet del comerciante
    nombre: String,           // nombre del negocio
    red_pago: String,         // cobro | payphone | mercadopago | yape
    total_recibido: u64,      // volumen total recibido
    activo: bool,             // estado del comerciante
}

// Cuenta de transacción
Transaction {
    from: Pubkey,             // wallet origen
    to: Pubkey,               // wallet destino
    monto: u64,               // monto bruto
    fee: u64,                 // comisión cobrada
    red_origen: String,       // red de pago de origen
    timestamp: i64,           // unix timestamp
    estado: EstadoTx,         // Pendiente | Completada | Revertida
}
```

## Cómo usar el protocolo

### Requisitos

- Solana CLI
- Anchor Framework
- Node.js 18+

### Instalación

```bash
git clone https://github.com/tu-usuario/nexum-protocol
cd nexum-protocol
yarn install
```

### Build y deploy

```bash
# Compilar el programa
anchor build

# Ejecutar en devnet
anchor deploy --provider.cluster devnet

# Correr el cliente de prueba
cd client
yarn run client.ts
```

### Ejemplo de uso

```typescript
// Inicializar el protocolo
await program.methods
  .initialize(30) // 0.3% de comisión
  .accounts({ protocol: protocolPda, authority })
  .rpc();

// Registrar un comerciante
await program.methods
  .registerMerchant("Tienda El Sol", "cobro")
  .accounts({ merchant: merchantPda, owner })
  .rpc();

// Consultar estado del protocolo
const protocol = await program.account.protocol.fetch(protocolPda);
console.log("Volumen total:", protocol.totalVolume.toString());
```

## Roadmap

**Fase 1 — Bootcamp (ahora)**
Protocolo core en Anchor, token NEXUM, cliente de prueba en devnet

**Fase 2 — 2026**
Integración con APIs de Cobro y PayPhone Ecuador, 100 comerciantes piloto

**Fase 3 — 2027**
Expansión a Colombia, Perú y México — Nequi, Yape, Mercado Pago

**Fase 4 — 2028+**
Puente con Stripe y Wise para pagos internacionales globales

## Mercado

| Métrica | Valor |
|---|---|
| Mercado pagos digitales Latam | $200B/año |
| Crecimiento anual | 30% |
| Comisión promedio actual | 6.5% |
| Comisión Nexum | 0.3% |
| Migrantes latinos enviando remesas | 45M personas |

## Programa desplegado

- **Network:** Solana Devnet
- **Program ID:** `CXnkP4Zay8sZtpAmve9ubTfHFwZDzuy1Jjrn6miinRdD`

## Autor

Desarrollado para el bootcamp **Solana Developer — WayLearn**

---

*Nexum — porque lo que le falta al mundo de los pagos no es otra app. Es una conexión.*

