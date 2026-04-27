/* eslint-disable @typescript-eslint/no-explicit-any */
import { Buffer } from "buffer"
  ; (globalThis as any).Buffer = Buffer

import { useState, useEffect } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from "@solana/web3.js"

function decodeProtocoloData(data: Buffer): { totalTransacciones: bigint; nombre: string } | null {
  try {
    const disc = data.slice(0, 8)
    const expectedDisc = Buffer.from([99, 237, 230, 83, 180, 95, 49, 77])
    if (!disc.equals(expectedDisc)) return null

    let offset = 8 + 32 // discriminator + authority

    const nombreLen = data.readUInt32LE(offset)
    offset += 4
    const nombre = data.slice(offset, offset + nombreLen).toString("utf8").replace(/\0/g, "")
    offset += nombreLen

    offset += 2 // fee_bps (Borsh no agrega padding entre campos)

    const totalVolume = data.readBigUInt64LE(offset)
    offset += 8

      const totalTransacciones = data.readBigUInt64LE(offset) as bigint

      return { totalTransacciones, nombre }
  } catch {
    return null
  }
}
import "./App.css"


const PROGRAM_ID = new PublicKey("8gkKQjfQHUZMPZqGMdRuuQoiSxmSqMnuG248LE8mcN2Q")


const DISC = {
  initialize: Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]),
  registerEmpresa: Buffer.from([199, 216, 68, 141, 228, 45, 54, 198]),
  updateEmpresa: Buffer.from([18, 242, 134, 167, 47, 236, 233, 63]),
  deactivateEmpresa: Buffer.from([151, 53, 121, 125, 201, 176, 10, 237]),
  liquidarPago: Buffer.from([107, 53, 210, 189, 236, 89, 228, 207]),
  depositar: Buffer.from([207, 16, 199, 114, 220, 5, 105, 219]),
}

// Helpers de encoding
const encStr = (s: string) => {
  const b = Buffer.from(s, "utf8")
  const l = Buffer.alloc(4)
  l.writeUInt32LE(b.length, 0)
  return Buffer.concat([l, b])
}

const u64ToBuffer = (n: bigint) => {
  const b = Buffer.alloc(8)
  b.writeBigUInt64LE(n, 0)
  return b
}

const encOption = (s: string) => {
  if (!s.trim()) return Buffer.from([0])
  return Buffer.concat([Buffer.from([1]), encStr(s)])
}

// PDAs ─────────
const PROTOCOLO_PDA = PublicKey.findProgramAddressSync(
  [Buffer.from("protocolo")],
  PROGRAM_ID
)[0]

const getEmpresaPDA = (owner: PublicKey) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from("empresa"), owner.toBuffer()],
    PROGRAM_ID
  )[0]






// Tipos ────────
interface EmpresaLocal {
  nombre: string
  pais: string
  balance: number
  totalEnviado: number
  totalRecibido: number
  activa: boolean
}

interface TxLocal {
  sig: string
  monto: number
  fee: number
  montoNeto: number
  timestamp: string
  destino: string
}

interface Notif {
  tipo: "exito" | "error" | "info"
  mensaje: string
}

export default function App() {
  const { publicKey, signTransaction } = useWallet()
  const { connection } = useConnection()
  const [fInit, setFInit] = useState({ nombre: "" })
  const [fEmp, setFEmp] = useState({ nombre: "", pais: "" })
  const [fDep, setFDep] = useState({ monto: "" })
  const [fPago, setFPago] = useState({ dest: "", monto: "" })
  const [fUpd, setFUpd] = useState({ nombre: "", pais: "" })
  const [montoNum, setMontoNum] = useState(0)
  const [feeNum, setFeeNum] = useState(0)
  const [netoNum, setNetoNum] = useState(0)
  const [loadingInit, setLoadingInit] = useState(false)
  const [loadingEmp, setLoadingEmp] = useState(false)
  const [loadingDep, setLoadingDep] = useState(false)
  const [loadingPago, setLoadingPago] = useState(false)
  const [loadingUpdate, setLoadingUpdate] = useState(false)
  const [notif, setNotif] = useState<Notif | null>(null)
  const [tab, setTab] = useState<"init" | "empresa" | "pagar" | "update">("init")
  const [empresa, setEmpresa] = useState<EmpresaLocal | null>(null)
  const [protocoloExiste, setProtocoloExiste] = useState(false)
  const [txs, setTxs] = useState<TxLocal[]>([])
  const [txCount, setTxCount] = useState<bigint>(0n)
  const [protocoloData, setProtocoloData] = useState<{ totalTxs: number } | null>(null)

  // Refresh empresa from chain
  const refreshEmpresa = async () => {
    if (!publicKey) return
    try {
      const empPDA = getEmpresaPDA(publicKey)
      const info = await connection.getAccountInfo(empPDA)
      if (info && info.data && info.data.length > 0) {
        const data = info.data
        const nombreLen = data.readUInt32LE(40)
        const nombre = data.slice(44, 44 + nombreLen).toString("utf8").replace(/\0/g, "")
        const paisOffset = 44 + nombreLen
        const paisLen = data.readUInt32LE(paisOffset)
        const pais = data.slice(paisOffset + 4, paisOffset + 4 + paisLen).toString("utf8").replace(/\0/g, "")
        const balanceOffset = paisOffset + 4 + paisLen
        const balance = Number(data.readBigUInt64LE(balanceOffset)) / 1_000_000
        const totalEnviado = Number(data.readBigUInt64LE(balanceOffset + 8)) / 1_000_000
        const totalRecibido = Number(data.readBigUInt64LE(balanceOffset + 16)) / 1_000_000
        console.log("=== refreshEmpresa ===")
        console.log("PDA:", empPDA.toBase58())
        console.log("Balance (raw bytes):", data.slice(balanceOffset, balanceOffset + 8).toString("hex"))
        console.log("Balance (lamports):", data.readBigUInt64LE(balanceOffset).toString())
        console.log("Balance (NEXUM):", balance)
        console.log("TotalEnviado:", totalEnviado)
        console.log("TotalRecibido:", totalRecibido)
        setEmpresa({
          nombre,
          pais,
          balance,
          totalEnviado,
          totalRecibido,
          activa: true,
        })
      }
    } catch (e) {
      console.error("Error refreshing:", e)
    }
  }

  // Refresh protocolo from chain
  const refreshProtocolo = async () => {
    try {
      const info = await connection.getAccountInfo(PROTOCOLO_PDA)
      if (info && info.data && info.data.length > 0) {
        const decoded = decodeProtocoloData(info.data)
        if (decoded) {
          setTxCount(decoded.totalTransacciones)
          setProtocoloData({ totalTxs: Number(decoded.totalTransacciones) })
          console.log("Protocolo totalTransacciones:", Number(decoded.totalTransacciones))
        }
      }
    } catch (e) {
      console.error("Error refresh protocolo:", e)
    }
  }

  // Toast
  const toast = (tipo: Notif["tipo"], mensaje: string) => {
    setNotif({ tipo, mensaje })
    setTimeout(() => setNotif(null), 4000)
  }

  // Verificar si existe el protocolo y cargar total_txs
  useEffect(() => {
    const verificar = async () => {
      if (!connection) return
      try {
        const info = await connection.getAccountInfo(PROTOCOLO_PDA)
        setProtocoloExiste(info !== null)
        if (info && info.data && info.data.length > 0) {
          const decoded = decodeProtocoloData(info.data)
          if (decoded) {
            console.log("Protocolo decoded:")
            console.log("- nombre:", decoded.nombre)
            console.log("- totalTransacciones:", Number(decoded.totalTransacciones))
            setTxCount(decoded.totalTransacciones)
            setProtocoloExiste(true)
          }
        }
      } catch (e) {
        console.error("Error decodificando protocolo:", e)
        setProtocoloExiste(false)
      }
    }
    verificar()
  }, [connection])

  // Verificar si existe la empresa
  useEffect(() => {
    const verificar = async () => {
      if (!connection || !publicKey) return
      try {
        const empPDA = getEmpresaPDA(publicKey)
        const info = await connection.getAccountInfo(empPDA)
        if (info && info.data && info.data.length > 0) {
          const data = info.data
          // Anchor: discriminator(8) + owner(32) + nombreLen(4) + nombre(n) + paisLen(4) + pais(p) + balance(8) + totalEnv(8) + totalRec(8) + activa(1)
          const nombreLen = data.readUInt32LE(40)
          const nombre = data.slice(44, 44 + nombreLen).toString("utf8").replace(/\0/g, "")
          const paisOffset = 44 + nombreLen
          const paisLen = data.readUInt32LE(paisOffset)
          const pais = data.slice(paisOffset + 4, paisOffset + 4 + paisLen).toString("utf8").replace(/\0/g, "")
          const balanceOffset = paisOffset + 4 + paisLen
          const balance = Number(data.readBigUInt64LE(balanceOffset)) / 1_000_000
          const totalEnviado = Number(data.readBigUInt64LE(balanceOffset + 8)) / 1_000_000
          const totalRecibido = Number(data.readBigUInt64LE(balanceOffset + 16)) / 1_000_000
          console.log("nombre:", nombre, "pais:", pais, "balance:", balance, "enviado:", totalEnviado, "recibido:", totalRecibido)
          setEmpresa({
            nombre,
            pais,
            balance,
            totalEnviado,
            totalRecibido,
            activa: true,
          })
        } else {
          setEmpresa(null)
        }
      } catch (e) {
        console.error("Error cargando empresa:", e)
        setEmpresa(null)
      }
    }
    verificar()
  }, [connection, publicKey])

  // Sincronizar fPago.monto con estados numéricos
  useEffect(() => {
    const m = parseFloat(fPago.monto) || 0
    setMontoNum(m)
    setFeeNum(m * 0.003)
    setNetoNum(m - m * 0.003)
  }, [fPago.monto])

  // Enviar transacción con reintento automático y manejo robusto de errores
  const sendIx = async (keys: any[], data: Buffer, retries = 3): Promise<string> => {
    if (!publicKey || !signTransaction) throw new Error("Wallet no conectada")

    let lastError: Error | null = null
    let lastSig: string | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed")

        const tx = new Transaction({
          recentBlockhash: blockhash,
          feePayer: publicKey,
        })
        tx.add(new TransactionInstruction({ programId: PROGRAM_ID, keys, data }))

        const signed = await signTransaction(tx)
        const rawTx = signed.serialize()

        lastSig = await connection.sendRawTransaction(rawTx, {
          skipPreflight: false,
          preflightCommitment: "confirmed",
        })

        // Esperar confirmación con timeout para evitar UI colgada
        const confirmPromise = connection.confirmTransaction(
          {
            signature: lastSig,
            blockhash,
            lastValidBlockHeight,
          },
          "confirmed"
        )
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Timeout confirmando transacción")), 25000)
        })
        await Promise.race([confirmPromise, timeoutPromise])

        return lastSig
      } catch (e: any) {
        lastError = e
        const errorMsg = e.message?.toString() || ""
        console.log("Error en intento", attempt + 1, ":", errorMsg)

        // El usuario canceló la firma en la wallet: no reintentar
        if (errorMsg.includes("User rejected")) {
          throw new Error("Firma cancelada en wallet")
        }

        // Si ya tenemos una firma, verificar si fue procesada
        if (lastSig) {
          try {
            const status = await connection.getSignatureStatus(lastSig)
            if (status?.value?.confirmationStatus === "confirmed" ||
                status?.value?.confirmationStatus === "finalized" ||
                status?.value?.confirmationStatus === "processed") {
              console.log("TX ya procesada:", lastSig)
              return lastSig
            }
          } catch {}
        }

        // Error lógico de seeds: no reintentar aquí, lo maneja handlePago con otros PDA candidates
        if (errorMsg.includes("ConstraintSeeds")) {
          throw e
        }

        // Error de blockhash - reintentar
        if (errorMsg.includes("Blockhash not found") ||
            errorMsg.includes("blockhash not found") ||
            errorMsg.includes("block height exceeded")) {
          console.log(`Reintento ${attempt + 1}/${retries} por blockhash...`)
          await new Promise(r => setTimeout(r, 1500))
          continue
        }

        // Error de TX ya procesada
        if (errorMsg.includes("already been processed") || errorMsg.includes("already in flight")) {
          if (lastSig) return lastSig
          throw new Error("Transacción ya procesada")
        }

        // Si es el último intento, lanzar error
        if (attempt >= retries) break

        // Otros errores - reintentar
        await new Promise(r => setTimeout(r, 1000))
      }
    }

    // Si tenemos firma pero falló la confirmación, verificar una última vez
    if (lastSig) {
      try {
        const status = await connection.getSignatureStatus(lastSig)
        if (status?.value?.confirmationStatus) {
          return lastSig
        }
      } catch {}
    }

    throw lastError
  }

  //  initialize
  const handleInit = async () => {
    if (!publicKey) return toast("error", "Conecta tu wallet")
    if (!fInit.nombre.trim()) return toast("error", "El nombre es requerido")
    setLoadingInit(true)
    try {
      // Verificar si ya existe
      const info = await connection.getAccountInfo(PROTOCOLO_PDA)
      if (info) {
        toast("info", `✓ Protocolo ya inicializado en ${PROTOCOLO_PDA.toBase58().slice(0, 8)}...`)
        setLoadingInit(false)
        return
      }

      const sig = await sendIx(
        [
          { pubkey: PROTOCOLO_PDA, isSigner: false, isWritable: true },
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        Buffer.concat([DISC.initialize, encStr(fInit.nombre.trim())])
      )
      toast("exito", `✓ Protocolo "${fInit.nombre}" inicializado — ${sig.slice(0, 8)}...`)
      setFInit({ nombre: "" })
    } catch (e: any) {
      toast("error", e.message)
    }
    setLoadingInit(false)
  }

  // register_empresa
  const handleRegEmp = async () => {
    if (!publicKey) return toast("error", "Conecta tu wallet")
    if (loadingEmp) return
    if (!fEmp.nombre.trim() || !fEmp.pais.trim())
      return toast("error", "Nombre y país requeridos")
    setLoadingEmp(true)
    try {
      const empPDA = getEmpresaPDA(publicKey)

      // Verificar si ya existe
      const info = await connection.getAccountInfo(empPDA)
      if (info) {
        toast("info", "✓ Empresa ya registrada en esta wallet")
        setEmpresa({
          nombre: fEmp.nombre,
          pais: fEmp.pais,
          balance: 0,
          totalEnviado: 0,
          totalRecibido: 0,
          activa: true,
        })
        setLoadingEmp(false)
        return
      }

      const sig = await sendIx(
        [
          { pubkey: empPDA, isSigner: false, isWritable: true },
          { pubkey: PROTOCOLO_PDA, isSigner: false, isWritable: true },
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        Buffer.concat([
          DISC.registerEmpresa,
          encStr(fEmp.nombre.trim()),
          encStr(fEmp.pais.trim()),
        ])
      )
      toast("exito", `✓ Empresa "${fEmp.nombre}" registrada — ${sig.slice(0, 8)}...`)
      await refreshEmpresa()
      setFEmp({ nombre: "", pais: "" })
    } catch (e: any) {
      toast("error", e.message)
    }
    setLoadingEmp(false)
  }


  //depositar
  const handleDeposit = async () => {
    if (!publicKey) return toast("error", "Conecta tu wallet")
    if (loadingDep) return // guard contra doble envío
    const monto = parseFloat(fDep.monto)
    if (!monto || monto <= 0) return toast("error", "Monto inválido")
    setLoadingDep(true)
    try {
      const empPDA = getEmpresaPDA(publicKey)
      const sig = await sendIx(
        [
          { pubkey: empPDA, isSigner: false, isWritable: true },
          { pubkey: publicKey, isSigner: true, isWritable: true },
        ],
        Buffer.concat([DISC.depositar, u64ToBuffer(BigInt(Math.floor(monto * 1_000_000)))])
      )
      toast("exito", `✓ ${monto} NEXUM depositados — ${sig.slice(0, 8)}...`)
      await new Promise(r => setTimeout(r, 2000))
      await refreshEmpresa()
      setFDep({ monto: "" })
    } catch (e: any) {
      toast("error", e.message)
    }
    setLoadingDep(false)
  }

  // update_empresa
  const handleUpdate = async () => {
    if (!publicKey) return toast("error", "Conecta tu wallet")
    if (!fUpd.nombre.trim() && !fUpd.pais.trim())
      return toast("error", "Ingresa al menos un campo")
    setLoadingUpdate(true)
    try {
      const empPDA = getEmpresaPDA(publicKey)
      const sig = await sendIx(
        [
          { pubkey: empPDA, isSigner: false, isWritable: true },
          { pubkey: publicKey, isSigner: true, isWritable: false },
        ],
        Buffer.concat([
          DISC.updateEmpresa,
          encOption(fUpd.nombre),
          encOption(fUpd.pais),
        ])
      )
      toast("exito", `✓ Empresa actualizada — ${sig.slice(0, 8)}...`)
      await refreshEmpresa()
      setFUpd({ nombre: "", pais: "" })
    } catch (e: any) {
      toast("error", e.message)
    }
    setLoadingUpdate(false)
  }

  // toggle empresa activa/inactiva
  const handleToggleActiva = async () => {
    if (!publicKey || !empresa) return
    setLoadingUpdate(true)
    try {
      const empPDA = getEmpresaPDA(publicKey)
      const newState = empresa.activa ? 0 : 1
      const sig = await sendIx(
        [
          { pubkey: empPDA, isSigner: false, isWritable: true },
          { pubkey: publicKey, isSigner: true, isWritable: false },
        ],
        Buffer.concat([DISC.deactivateEmpresa, Buffer.alloc(1, newState)])
      )
      toast("exito", `✓ Empresa ${newState ? "activada" : "desactivada"} — ${sig.slice(0, 8)}...`)
      await new Promise(r => setTimeout(r, 2000))
      await refreshEmpresa()
    } catch (e: any) {
      toast("error", e.message)
    }
    setLoadingUpdate(false)
  }

  // liquidar_pago
  const handlePago = async () => {
    if (!publicKey) return toast("error", "Conecta tu wallet")
    if (!fPago.dest.trim() || !montoNum)
      return toast("error", "Destinatario y monto requeridos")
    if (montoNum <= 0) return toast("error", "Monto inválido")

    if (empresa && montoNum > empresa.balance) {
      return toast("error", `Saldo insuficiente. Balance actual: ${empresa.balance} NEXUM`)
    }

    setLoadingPago(true)
    try {
      const destPubkey = new PublicKey(fPago.dest.trim())
      const origenPDA = getEmpresaPDA(publicKey)
      const destPDA = getEmpresaPDA(destPubkey)
      const montoLamports = Math.floor(montoNum * 1_000_000)

      // Obtener txCount desde chain usando el decoder
      let txCountBigInt = BigInt(txCount)
      const protoInfo = await connection.getAccountInfo(PROTOCOLO_PDA)
      if (protoInfo && protoInfo.data) {
        const decoded = decodeProtocoloData(protoInfo.data)
        if (decoded) {
          txCountBigInt = decoded.totalTransacciones
        }
      }
      const deriveTxPda = (
        seedPrefix: "tx" | "transaccion",
        seedOwner: PublicKey,
        nonce: bigint
      ) => {
        const buffer = Buffer.alloc(8)
        buffer.writeBigUInt64LE(nonce, 0)
        return PublicKey.findProgramAddressSync(
          [Buffer.from(seedPrefix), seedOwner.toBuffer(), buffer],
          PROGRAM_ID
        )[0]
      }


      // Log balance ANTES de la TX
      const infoAntes = await connection.getAccountInfo(origenPDA)
      if (infoAntes) {
        const dataAntes = infoAntes.data
        const nombreLenEmp = dataAntes.readUInt32LE(40)
        const paisOffset = 44 + nombreLenEmp
        const paisLen = dataAntes.readUInt32LE(paisOffset)
        const balanceOffset = paisOffset + 4 + paisLen
        const balanceAntes = Number(dataAntes.readBigUInt64LE(balanceOffset)) / 1_000_000
        console.log("Balance ANTES:", balanceAntes)
      }

      const ixData = Buffer.concat([
        DISC.liquidarPago,
        u64ToBuffer(BigInt(Math.floor(montoNum * 1_000_000))),
      ])
      const expectedNonce = txCountBigInt + 1n
      let txPDA = deriveTxPda("tx", publicKey, expectedNonce)
      console.log(
        "Intentando PDA transaccion con tx pagador nonce",
        expectedNonce.toString(),
        txPDA.toBase58()
      )

      let sig = ""
      try {
        sig = await sendIx(
          [
            { pubkey: PROTOCOLO_PDA, isSigner: false, isWritable: true },
            { pubkey: origenPDA, isSigner: false, isWritable: true },
            { pubkey: destPDA, isSigner: false, isWritable: true },
            { pubkey: txPDA, isSigner: false, isWritable: true },
            { pubkey: publicKey, isSigner: true, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          ],
          ixData
        )
      } catch (e: any) {
        const msg = e?.message?.toString?.() || ""
        if (!msg.includes("ConstraintSeeds")) throw e

        // Si Anchor expone el PDA esperado en "Right:", lo usamos directamente.
        const rightMatch = msg.match(/Program log: Right:[\s\S]*?Program log: ([1-9A-HJ-NP-Za-km-z]{32,44})/)
        if (!rightMatch) throw e

        txPDA = new PublicKey(rightMatch[1])
        console.log("Reintentando con PDA esperado por programa:", txPDA.toBase58())
        sig = await sendIx(
          [
            { pubkey: PROTOCOLO_PDA, isSigner: false, isWritable: true },
            { pubkey: origenPDA, isSigner: false, isWritable: true },
            { pubkey: destPDA, isSigner: false, isWritable: true },
            { pubkey: txPDA, isSigner: false, isWritable: true },
            { pubkey: publicKey, isSigner: true, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          ],
          ixData
        )
      }
      setTxs((prev) => [
        {
          sig,
          monto: montoNum,
          fee: feeNum,
          montoNeto: netoNum,
          timestamp: new Date().toLocaleTimeString(),
          destino: fPago.dest.slice(0, 8) + "...",
        },
        ...prev,
      ])
      setTxCount((c) => c + 1n)
      toast("exito", `✓ ${montoNum} NEXUM liquidados — Fee: ${feeNum.toFixed(4)}`)

      // Esperar a que la cadena procese la actualización
      await new Promise(r => setTimeout(r, 2000))
      await refreshEmpresa()
      setFPago({ dest: "", monto: "" })
    } catch (e: any) {
      const msg = e?.message || "Error en liquidación"
      if (msg.includes("Firma cancelada")) {
        toast("info", msg)
      } else {
        toast("error", msg)
      }
    } finally {
      setLoadingPago(false)
    }
  }


  return (
    <>
      {notif && (
        <div className={`notif notif-${notif.tipo}`}>{notif.mensaje}</div>
      )}

      <div className="app">
        <header className="hdr">
          <div>
            <div className="logo-name">
              NEX<span>UM</span>
            </div>
            <div className="logo-tag">RED DE PAGOS DESCENTRALIZADA · SOLANA DEVNET</div>
          </div>
          <div className="wallet-wrap">
            <WalletMultiButton />
          </div>
        </header>

        {!publicKey ? (
          <div className="hero">
            <div className="hero-ttl">
              El puente que
              <br />
              <span>Latam necesita</span>
            </div>
            <div className="hero-sub">
              Red de pagos descentralizada sobre Solana.
              <br />
              Liquidación instantánea · 0.3% de comisión · Sin intermediarios.
            </div>
            <div className="wallet-wrap">
              <WalletMultiButton />
            </div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="stats">
              <div className="stat">
                <div className="stat-lbl">Program ID</div>
                <div className="stat-val sm">
                  {PROGRAM_ID.toBase58().slice(0, 14)}...
                </div>
              </div>
              <div className="stat">
                <div className="stat-lbl">Comisión</div>
                <div className="stat-val green">0.3%</div>
              </div>
              <div className="stat">
                <div className="stat-lbl">Txs realizadas</div>
                <div className="stat-val">{txCount}</div>
              </div>
              <div className="stat">
                <div className="stat-lbl">Volumen local</div>
                <div className="stat-val sm">
                  {txs.reduce((a, t) => a + t.monto, 0).toFixed(2)} NEXUM
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
              {(
                [
                  { id: "init", label: "Protocolo" },
                  { id: "empresa", label: "Empresa" },
                  { id: "pagar", label: "Liquidar Pago" },
                  { id: "update", label: "Actualizar" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  className={`tab ${tab === t.id ? "on" : ""}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* INIT */}
            {tab === "init" && (
              <div className="panel">
                <div className="panel-hdr">
                  <span className="panel-ttl">
                    {protocoloExiste ? "Protocolo Inicializado" : "Inicializar Protocolo"}
                  </span>
                  <span className={`panel-tag ${protocoloExiste ? "green" : ""}`}>
                    {protocoloExiste ? "✓ ACTIVO" : "Crear · initialize()"}
                  </span>
                </div>
                <div className="panel-body">
                  {protocoloExiste ? (
                    <div className="protocolo-status">
                      <div className="status-icon">✓</div>
                      <div className="status-text">
                        <div className="status-label">El protocolo Nexum ya está inicializado</div>
                        <div className="status-sub">Puedes proceder a registrar tu empresa</div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="fgrid">
                        <div className="fg full">
                          <label className="flbl">Nombre del protocolo</label>
                          <input
                            className="finput"
                            placeholder="ej: Nexum Protocol v1"
                            value={fInit.nombre}
                            onChange={(e) => setFInit({ nombre: e.target.value })}
                          />
                        </div>
                      </div>
                      <button
                        className="btn btn-p"
                        onClick={handleInit}
                        disabled={loadingInit}
                      >
                        {loadingInit ? (
                          <>
                            <span className="spin" /> Inicializando...
                          </>
                        ) : (
                          "Inicializar red"
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* EMPRESA */}
            {tab === "empresa" && (
              <div className="panel">
                {!empresa ? (
                  <>
                    <div className="panel-hdr">
                      <span className="panel-ttl">Registrar empresa en la red</span>
                      <span className="panel-tag">CREAR · registrar empresa</span>
                    </div>
                    <div className="panel-body">
                      <div className="fgrid">
                        <div className="fg">
                          <label className="flbl">Nombre del negocio</label>
                          <input
                            className="finput"
                            placeholder="ej: Tienda El Sol"
                            value={fEmp.nombre}
                            onChange={(e) =>
                              setFEmp((p) => ({ ...p, nombre: e.target.value }))
                            }
                          />
                        </div>
                        <div className="fg">
                          <label className="flbl">País</label>
                          <input
                            className="finput"
                            placeholder="ej: Ecuador"
                            value={fEmp.pais}
                            onChange={(e) =>
                              setFEmp((p) => ({ ...p, pais: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                      <div className="bgroup">
                        <button
                          className="btn btn-p"
                          onClick={handleRegEmp}
                          disabled={loadingEmp}
                        >
                          {loadingEmp ? (
                            <>
                              <span className="spin" /> Registrando...
                            </>
                          ) : (
                            "Registrar empresa"
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="panel-hdr" style={{ padding: '0 0 14px' }}>
                      <span className="panel-ttl">Agregar fondos</span>
                      <span className="panel-tag">DEPOSITO · depositar</span>
                    </div>
                    <div className="fgrid">
                      <div className="fg full">
                        <label className="flbl">Monto a depositar (NEXUM)</label>
                        <input
                          className="finput"
                          type="number"
                          placeholder="0.00"
                          value={fDep.monto}
                          onChange={(e) => setFDep({ monto: e.target.value })}
                        />
                      </div>
                    </div>
                    <button
                      className="btn btn-s"
                      onClick={handleDeposit}
                      disabled={loadingDep}
                    >
                      {loadingDep ? <><span className="spin" /> Depositando...</> : "Agregar fondos"}
                    </button>

                    {/* Company Card */}
                    <div className="ecard">
                      <div className="ecard-hdr">
                        <div>
                          <div className="ename">{empresa.nombre}</div>
                          <div className="epais">{empresa.pais}</div>
                        </div>
                        <button
                          className={`badge ${empresa.activa ? "badge-on" : "badge-off"}`}
                          onClick={handleToggleActiva}
                          disabled={loadingUpdate}
                        >
                          {loadingUpdate ? "..." : empresa.activa ? "ACTIVA" : "INACTIVA"}
                        </button>
                      </div>
                      <div className="emetrics">
                        <div>
                          <div className="em-lbl">Balance</div>
                          <div className="em-val">{empresa.balance}</div>
                        </div>
                        <div>
                          <div className="em-lbl">Enviado</div>
                          <div className="em-val">{empresa.totalEnviado}</div>
                        </div>
                        <div>
                          <div className="em-lbl">Recibido</div>
                          <div className="em-val">{empresa.totalRecibido}</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            {tab === "pagar" && (
              <div className="panel">
                <div className="panel-hdr">
                  <span className="panel-ttl">Liquidar pago entre empresas</span>
                  <span className="panel-tag green">
                    0.3% FEE · liquidar pago
                  </span>
                </div>
                <div className="panel-body">
                  <div className="fgrid">
                    <div className="fg full">
                      <label className="flbl">Wallet destinatario</label>
                      <input
                        className="finput"
                        placeholder="Wallet de la empresa a pagar"
                        value={fPago.dest}
                        onChange={(e) =>
                          setFPago((p) => ({ ...p, dest: e.target.value }))
                        }
                      />
                    </div>
                    <div className="fg">
                      <label className="flbl">Monto (NEXUM)</label>
                      <input
                        className="finput"
                        type="number"
                        placeholder="0.00"
                        value={fPago.monto}
                        onChange={(e) =>
                          setFPago((p) => ({ ...p, monto: e.target.value }))
                        }
                      />
                    </div>
                    <div className="fg">
                      <label className="flbl">Estimación</label>
                      <div className="finput ro">
                        {montoNum > 0
                          ? `Fee: ${feeNum.toFixed(4)} · Neto: ${netoNum.toFixed(4)}`
                          : "Ingresa un monto"}
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn btn-p"
                    onClick={handlePago}
                    disabled={loadingPago}
                  >
                    {loadingPago ? (
                      <>
                        <span className="spin" /> Liquidando...
                      </>
                    ) : (
                      "Liquidar pago"
                    )}
                  </button>

                  {txs.length > 0 && (
                    <div className="tx-list">
                      <div className="tx-ttl">Pagos recientes</div>
                      {txs.map((tx, i) => (
                        <div key={i} className="tx-item">
                          <div>
                            <div className="tx-hash">
                              {tx.sig.slice(0, 16)}...
                            </div>
                            <div className="tx-meta">
                              → {tx.destino} · {tx.timestamp}
                            </div>
                          </div>
                          <div>
                            <div className="tx-amt">
                              {tx.monto.toFixed(2)} NEXUM
                            </div>
                            <div className="tx-fee">
                              fee {tx.fee.toFixed(4)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* UPDATE */}
            {tab === "update" && (
              <div className="panel">
                <div className="panel-hdr">
                  <span className="panel-ttl">Actualizar datos de empresa</span>
                  <span className="panel-tag">ACTUALIZAR · Actualizar datos</span>
                </div>
                <div className="panel-body">
                  <div className="fgrid">
                    <div className="fg">
                      <label className="flbl">Nuevo nombre (opcional)</label>
                      <input
                        className="finput"
                        placeholder="Dejar vacío para no cambiar"
                        value={fUpd.nombre}
                        onChange={(e) =>
                          setFUpd((p) => ({ ...p, nombre: e.target.value }))
                        }
                      />
                    </div>
                    <div className="fg">
                      <label className="flbl">Nuevo país (opcional)</label>
                      <input
                        className="finput"
                        placeholder="Dejar vacío para no cambiar"
                        value={fUpd.pais}
                        onChange={(e) =>
                          setFUpd((p) => ({ ...p, pais: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <button
                    className="btn btn-p"
                    onClick={handleUpdate}
                    disabled={loadingUpdate}
                  >
                    {loadingUpdate ? (
                      <>
                        <span className="spin" /> Actualizando...
                      </>
                    ) : (
                      "Actualizar empresa"
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
