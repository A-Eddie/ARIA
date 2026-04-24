// Color scheme and theme constants
export const COLORS = {
  bg: '#07080c',
  text: '#c8c5be',
  textMuted: '#8d8981',
  border: 'rgba(255,255,255,0.1)',
  borderLight: 'rgba(255,255,255,0.05)',
  
  primary: '#3b82f6',
  secondary: 'rgba(255,255,255,0.06)',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#0ea5e9',
};

export const STATUS_COLORS = {
  applied: '#3b82f6',
  shortlisted: '#8b5cf6',
  'phone-screen': '#0ea5e9',
  'technical': '#f59e0b',
  'interview': '#ec4899',
  'offer': '#10b981',
  'hired': '#059669',
  'rejected': '#ef4444',
  'declined': '#6b7280',
};

export const SCORE_COLORS = {
  5: '#10b981',
  4: '#3b82f6',
  3: '#f59e0b',
  2: '#f97316',
  1: '#ef4444',
};

export const JOB_STATUS_COLORS = {
  open: '#10b981',
  closed: '#ef4444',
  draft: '#8d8981',
  archived: '#6b7280',
};

export const ROLE_CATEGORIES = {
  'Software Engineer': [
    { value: 'junior', label: 'Junior (0-2 years)' },
    { value: 'mid', label: 'Mid-level (2-5 years)' },
    { value: 'senior', label: 'Senior (5+ years)' },
  ],
  'Product Manager': [
    { value: 'associate', label: 'Associate PM' },
    { value: 'manager', label: 'Product Manager' },
    { value: 'senior', label: 'Senior PM' },
  ],
  'Data Scientist': [
    { value: 'junior', label: 'Junior Data Scientist' },
    { value: 'mid', label: 'Data Scientist' },
    { value: 'senior', label: 'Senior Data Scientist' },
  ],
  'Designer': [
    { value: 'junior', label: 'Junior Designer' },
    { value: 'mid', label: 'Product Designer' },
    { value: 'senior', label: 'Lead Designer' },
  ],
  'Marketing': [
    { value: 'coordinator', label: 'Marketing Coordinator' },
    { value: 'manager', label: 'Marketing Manager' },
    { value: 'director', label: 'Marketing Director' },
  ],
  'Sales': [
    { value: 'executive', label: 'Sales Executive' },
    { value: 'manager', label: 'Sales Manager' },
    { value: 'director', label: 'Sales Director' },
  ],
  'DevOps': [
    { value: 'junior', label: 'Junior DevOps Engineer' },
    { value: 'mid', label: 'DevOps Engineer' },
    { value: 'senior', label: 'Senior DevOps Engineer' },
  ],
};

export const BILLING_PLANS = [
  {
    name: 'Starter',
    price: '$99',
    period: '/month',
    features: [
      'Up to 5 job postings',
      '50 AI evaluations/month',
      'Email support',
      '30-day candidate history',
    ],
  },
  {
    name: 'Professional',
    price: '$299',
    period: '/month',
    features: [
      'Unlimited job postings',
      '500 AI evaluations/month',
      'Priority support',
      '1-year candidate history',
      'Advanced analytics',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'pricing',
    features: [
      'Everything in Professional',
      'Unlimited evaluations',
      'Custom integrations',
      'Dedicated account manager',
      'SLA support',
    ],
  },
];

export const ANIMATIONS = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  timing: 'cubic-bezier(0.4, 0, 0.2, 1)',
};
