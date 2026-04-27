use anchor_lang::prelude::*;

declare_id!("8gkKQjfQHUZMPZqGMdRuuQoiSxmSqMnuG248LE8mcN2Q");

#[program]
pub mod nexum {
    use super::*;

    // CREATE — Inicializar la red de pagos
    pub fn initialize(
        ctx: Context<Initialize>,
        nombre: String,
    ) -> Result<()> {
        require!(nombre.len() <= 50, NexumError::NombreDemasiadoLargo);

        let protocolo = &mut ctx.accounts.protocolo;
        protocolo.authority = ctx.accounts.authority.key();
        protocolo.nombre = nombre;
        protocolo.fee_bps = 30; // 0.3% fijo
        protocolo.total_volume = 0;
        protocolo.total_transacciones = 0;
        protocolo.empresas = Vec::new();

        Ok(())
    }

    // CREATE — Registrar una empresa en la red
    pub fn register_empresa(
        ctx: Context<RegisterEmpresa>,
        nombre: String,
        pais: String,
    ) -> Result<()> {
        require!(nombre.len() <= 50, NexumError::NombreDemasiadoLargo);
        require!(pais.len() <= 30, NexumError::PaisInvalido);

        let empresa = &mut ctx.accounts.empresa;
        empresa.owner = ctx.accounts.owner.key();
        empresa.nombre = nombre;
        empresa.pais = pais;
        empresa.balance = 0;
        empresa.total_enviado = 0;
        empresa.total_recibido = 0;
        empresa.activa = true;

        // Registrar empresa en el protocolo
        let protocolo = &mut ctx.accounts.protocolo;
        protocolo.empresas.push(ctx.accounts.empresa.key());

        Ok(())
    }

    // READ — Consultar estado de una empresa
    pub fn get_empresa(ctx: Context<GetEmpresa>) -> Result<EmpresaInfo> {
        let empresa = &ctx.accounts.empresa;
        Ok(EmpresaInfo {
            nombre: empresa.nombre.clone(),
            pais: empresa.pais.clone(),
            balance: empresa.balance,
            total_enviado: empresa.total_enviado,
            total_recibido: empresa.total_recibido,
            activa: empresa.activa,
        })
    }

    // UPDATE — Actualizar datos de una empresa
    pub fn update_empresa(
        ctx: Context<UpdateEmpresa>,
        nombre: Option<String>,
        pais: Option<String>,
    ) -> Result<()> {
        let empresa = &mut ctx.accounts.empresa;

        require!(
            ctx.accounts.owner.key() == empresa.owner,
            NexumError::NoAutorizado
        );

        if let Some(n) = nombre {
            require!(n.len() <= 50, NexumError::NombreDemasiadoLargo);
            empresa.nombre = n;
        }

        if let Some(p) = pais {
            require!(p.len() <= 30, NexumError::PaisInvalido);
            empresa.pais = p;
        }

        Ok(())
    }

    // DELETE — Desactivar una empresa (solo authority)
    pub fn deactivate_empresa(
        ctx: Context<DeactivateEmpresa>
    ) -> Result<()> {
        require!(
            ctx.accounts.authority.key() == ctx.accounts.protocolo.authority,
            NexumError::NoAutorizado
        );
        ctx.accounts.empresa.activa = false;
        Ok(())
    }

    // CORE — Liquidar pago entre empresas con 0.3% de comisión
    pub fn liquidar_pago(
        ctx: Context<LiquidarPago>,
        monto: u64,
    ) -> Result<()> {
        require!(monto > 0, NexumError::MontoInvalido);
        require!(ctx.accounts.empresa_origen.activa, NexumError::EmpresaInactiva);
        require!(ctx.accounts.empresa_destino.activa, NexumError::EmpresaInactiva);
        require!(
            ctx.accounts.empresa_origen.balance >= monto,
            NexumError::SaldoInsuficiente
        );

        // Calcular comisión 0.3%
        let fee = (monto as u128)
            .checked_mul(30).unwrap()
            .checked_div(10_000).unwrap() as u64;
        let monto_neto = monto.checked_sub(fee).unwrap();

        // Debitar origen
        ctx.accounts.empresa_origen.balance = ctx.accounts.empresa_origen
            .balance.checked_sub(monto).unwrap();
        ctx.accounts.empresa_origen.total_enviado = ctx.accounts.empresa_origen
            .total_enviado.checked_add(monto).unwrap();

        // Acreditar destino
        ctx.accounts.empresa_destino.balance = ctx.accounts.empresa_destino
            .balance.checked_add(monto_neto).unwrap();
        ctx.accounts.empresa_destino.total_recibido = ctx.accounts.empresa_destino
            .total_recibido.checked_add(monto_neto).unwrap();

        // Registrar transacción
        let tx = &mut ctx.accounts.transaccion;
        tx.origen = ctx.accounts.empresa_origen.owner;
        tx.destino = ctx.accounts.empresa_destino.owner;
        tx.monto = monto;
        tx.fee = fee;
        tx.monto_neto = monto_neto;
        tx.timestamp = Clock::get()?.unix_timestamp;
        tx.estado = EstadoTx::Completada;

        // Actualizar métricas del protocolo
        let protocolo = &mut ctx.accounts.protocolo;
        protocolo.total_volume = protocolo.total_volume
            .checked_add(monto).unwrap();
        protocolo.total_transacciones = protocolo.total_transacciones
            .checked_add(1).unwrap();

        Ok(())
    }

    // CORE — Depositar balance a una empresa
    pub fn depositar(
        ctx: Context<Depositar>,
        monto: u64,
    ) -> Result<()> {
        require!(monto > 0, NexumError::MontoInvalido);
        require!(ctx.accounts.empresa.activa, NexumError::EmpresaInactiva);

        ctx.accounts.empresa.balance = ctx.accounts.empresa
            .balance.checked_add(monto).unwrap();

        Ok(())
    }
}

// ============ CONTEXTOS ============

#[derive(Accounts)]
#[instruction(nombre: String)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Protocolo::INIT_SPACE,
        seeds = [b"protocolo"],
        bump
    )]
    pub protocolo: Account<'info, Protocolo>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(nombre: String, pais: String)]
pub struct RegisterEmpresa<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + Empresa::INIT_SPACE,
        seeds = [b"empresa", owner.key().as_ref()],
        bump
    )]
    pub empresa: Account<'info, Empresa>,
    #[account(mut, seeds = [b"protocolo"], bump)]
    pub protocolo: Account<'info, Protocolo>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GetEmpresa<'info> {
    #[account(seeds = [b"empresa", empresa.owner.as_ref()], bump)]
    pub empresa: Account<'info, Empresa>,
}

#[derive(Accounts)]
pub struct UpdateEmpresa<'info> {
    #[account(
        mut,
        seeds = [b"empresa", owner.key().as_ref()],
        bump
    )]
    pub empresa: Account<'info, Empresa>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct DeactivateEmpresa<'info> {
    #[account(mut, seeds = [b"protocolo"], bump)]
    pub protocolo: Account<'info, Protocolo>,
    #[account(mut, seeds = [b"empresa", empresa.owner.as_ref()], bump)]
    pub empresa: Account<'info, Empresa>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct LiquidarPago<'info> {
    #[account(mut, seeds = [b"protocolo"], bump)]
    pub protocolo: Account<'info, Protocolo>,
    #[account(mut, seeds = [b"empresa", empresa_origen.owner.as_ref()], bump)]
    pub empresa_origen: Account<'info, Empresa>,
    #[account(mut, seeds = [b"empresa", empresa_destino.owner.as_ref()], bump)]
    pub empresa_destino: Account<'info, Empresa>,
    #[account(
        init,
        payer = pagador,
        space = 8 + Transaccion::INIT_SPACE,
        seeds = [
            b"tx",
            pagador.key().as_ref(),
            &protocolo.total_transacciones.to_le_bytes()
        ],
        bump
    )]
    pub transaccion: Account<'info, Transaccion>,
    #[account(mut)]
    pub pagador: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Depositar<'info> {
    #[account(
        mut,
        seeds = [b"empresa", owner.key().as_ref()],
        bump
    )]
    pub empresa: Account<'info, Empresa>,
    pub owner: Signer<'info>,
}

// ============ CUENTAS ============

#[account]
#[derive(InitSpace)]
pub struct Protocolo {
    pub authority: Pubkey,
    #[max_len(50)]
    pub nombre: String,
    pub fee_bps: u16,
    pub total_volume: u64,
    pub total_transacciones: u64,
    #[max_len(100)]
    pub empresas: Vec<Pubkey>,
}

#[account]
#[derive(InitSpace)]
pub struct Empresa {
    pub owner: Pubkey,
    #[max_len(50)]
    pub nombre: String,
    #[max_len(30)]
    pub pais: String,
    pub balance: u64,
    pub total_enviado: u64,
    pub total_recibido: u64,
    pub activa: bool,
}

#[account]
#[derive(InitSpace)]
pub struct Transaccion {
    pub origen: Pubkey,
    pub destino: Pubkey,
    pub monto: u64,
    pub fee: u64,
    pub monto_neto: u64,
    pub timestamp: i64,
    pub estado: EstadoTx,
}

// ============ TIPOS ============

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct EmpresaInfo {
    pub nombre: String,
    pub pais: String,
    pub balance: u64,
    pub total_enviado: u64,
    pub total_recibido: u64,
    pub activa: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, InitSpace)]
pub enum EstadoTx {
    Pendiente,
    Completada,
    Revertida,
}

// ============ ERRORES ============

#[error_code]
pub enum NexumError {
    #[msg("El monto debe ser mayor a cero")]
    MontoInvalido,
    #[msg("La empresa no está activa")]
    EmpresaInactiva,
    #[msg("No tienes autorización para esta acción")]
    NoAutorizado,
    #[msg("Nombre demasiado largo, máximo 50 caracteres")]
    NombreDemasiadoLargo,
    #[msg("País inválido")]
    PaisInvalido,
    #[msg("Saldo insuficiente para realizar el pago")]
    SaldoInsuficiente,
}
