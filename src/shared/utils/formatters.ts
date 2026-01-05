export const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('es-CL', { 
    style: 'currency', 
    currency: 'CLP' 
  }).format(amount);
};

