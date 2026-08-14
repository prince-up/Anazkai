export const SUBSCRIPTION_PLANS = [
  {
    id: 'weekly',
    name: 'Weekly',
    priceInr: 1500,
    interval: 'week',
    displayPrice: '₹1,500',
    detail: 'per week',
  },
  {
    id: 'monthly',
    name: 'Monthly',
    priceInr: 3000,
    interval: 'month',
    displayPrice: '₹3,000',
    detail: 'per month',
  },
  {
    id: 'yearly',
    name: 'Yearly',
    priceInr: 6000,
    interval: 'year',
    displayPrice: '₹6,000',
    detail: 'per year',
    recommended: true,
  },
]

export const getSubscriptionPlan = (id) => SUBSCRIPTION_PLANS.find((plan) => plan.id === id)
