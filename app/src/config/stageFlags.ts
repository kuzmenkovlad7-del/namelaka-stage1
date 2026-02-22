export const stageFlags = {
  stageMode: String(import.meta.env.VITE_STAGE_MODE || 'stage1'),
  enableCheckout: String(import.meta.env.VITE_ENABLE_CHECKOUT || 'false') === 'true',
  enablePayment: String(import.meta.env.VITE_ENABLE_PAYMENT || 'false') === 'true',
  enableDelivery: String(import.meta.env.VITE_ENABLE_DELIVERY || 'false') === 'true',
} as const

export const isStage1 = stageFlags.stageMode === 'stage1'
