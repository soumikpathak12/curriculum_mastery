declare module '@cashfreepayments/cashfree-js' {
  export type CashfreeMode = 'sandbox' | 'production'

  export interface LoadOptions {
    mode: CashfreeMode
  }

  export interface CheckoutOptions {
    paymentSessionId: string
    redirectTarget?: '_self' | '_blank'
  }

  export interface CashfreeInstance {
    checkout(options: CheckoutOptions): Promise<void>
  }

  export function load(options: LoadOptions): Promise<CashfreeInstance>
}


