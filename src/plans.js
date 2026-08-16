export const SUBSCRIPTION_PLANS = [
  {
    id: '1-hour',
    name: 'Anazk 1 Hour',
    priceInr: 300,
    interval: 'day',
    displayPrice: '₹300',
    detail: '1 Hour Session',
    durationMinutes: 60,
  },
  {
    id: '2-hour',
    name: 'Anazk 2 Hours',
    priceInr: 600,
    interval: 'day',
    displayPrice: '₹600',
    detail: '2 Hours Session',
    durationMinutes: 120,
  },
  {
    id: '10-sessions',
    name: 'Anazk 10 Sessions',
    priceInr: 2900,
    interval: 'day',
    displayPrice: '₹2,900',
    detail: '10 Interview Sessions',
    durationMinutes: 1200,
  },
  {
    id: 'weekly',
    name: 'Weekly',
    priceInr: 1500,
    interval: 'week',
    displayPrice: '₹1,500',
    detail: 'per week',
    durationMinutes: 7 * 24 * 60, // 10080 mins
  },
  {
    id: 'monthly',
    name: 'Monthly',
    priceInr: 3000,
    interval: 'month',
    displayPrice: '₹3,000',
    detail: 'per month',
    durationMinutes: 30 * 24 * 60, // 43200 mins
    recommended: true,
  },
  {
    id: 'yearly',
    name: 'Yearly',
    priceInr: 6000,
    interval: 'year',
    displayPrice: '₹6,000',
    detail: 'per year',
    durationMinutes: 365 * 24 * 60, // 525600 mins
  },
]

export const getSubscriptionPlan = (id) => SUBSCRIPTION_PLANS.find((plan) => plan.id === id)
