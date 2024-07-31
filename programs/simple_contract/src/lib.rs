use anchor_lang::prelude::*;

const MAX_CALLS: u8 = 3;
const TIME_PERIOD: i64 = 15;

declare_id!("4J9r4AoVd2wyg5TKwVBQrqj47JVi4FAWXp9eY5Rutg9s");
#[program]
pub mod simple_contract {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, asset: Pubkey) -> Result<()> {
        let price_stats = &mut ctx.accounts.price_stats;
        price_stats.price = 12345;
        price_stats.asset = asset;
        msg!("price_stats Account Created");
        msg!("Current price: {}", price_stats.price);
    
        Ok(())
    }

    pub fn update_price(ctx: Context<UpdatePrice>) -> Result<()> {
        let clock = Clock::get()?;
        let caller_info = &mut ctx.accounts.caller_info;

        if clock.unix_timestamp - caller_info.last_reset > TIME_PERIOD {
            caller_info.call_count = 0;
            caller_info.last_reset = clock.unix_timestamp;
        }

        if caller_info.call_count >= MAX_CALLS {
            return Err(ErrorCode::TooManyCalls.into());
        }

        
        caller_info.call_count += 1;
        

        ctx.accounts.price_state.price = 123456;

        Ok(())
    }

}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 8 +32)]
    pub price_stats: Account<'info, PriceStats>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct PriceStats {
    pub price: u64,
    pub asset: Pubkey,
}

#[derive(Accounts)]
pub struct UpdatePrice<'info> {
    #[account(mut)]
    pub price_state: Account<'info, PriceStats>,
    #[account(
        init,
        payer = user,
        seeds = [b"caller_info", user.key().as_ref()],
        bump,
        space = 8 + 8 + 1
    )]
    pub caller_info: Account<'info, CallerInfo>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct CallerInfo {
    pub call_count: u8,
    pub last_reset: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Too many calls in the specified period")]
    TooManyCalls,
}