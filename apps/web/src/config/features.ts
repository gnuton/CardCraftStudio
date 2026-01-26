// Feature flags for the application

// Controls whether the payment/upgrade system is active
// If false, upgrade options will be hidden or disabled
export const ENABLE_PAYMENTS = import.meta.env.VITE_ENABLE_PAYMENTS === 'true';
