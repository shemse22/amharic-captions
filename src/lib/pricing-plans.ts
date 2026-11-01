export type PlanId = 'LITE' | 'PLUS' | 'PRO' | 'MAX';

export interface PricingPlan {
  id: PlanId;
  name: string;
  amharicName: string;
  priceEtb: number;
  minutes: number;
  credits: number;
  tag: string;
  tagAmharic: string;
  description: string;
  buttonLabel: string;
  popular?: boolean;
  features: string[];
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'LITE',
    name: 'Lite',
    amharicName: 'Lite',
    priceEtb: 50,
    minutes: 5,
    credits: 30000,
    tag: 'Try Bgern',
    tagAmharic: 'Trial',
    description: 'Try Bgern with your first Amharic caption projects.',
    buttonLabel: 'Choose Lite',
    features: [
      'Fast Telebirr verification',
      'Amharic caption export',
      'Great for first-time creators',
    ],
  },
  {
    id: 'PLUS',
    name: 'Plus',
    amharicName: 'Plus',
    priceEtb: 150,
    minutes: 14,
    credits: 90000,
    tag: 'Create More',
    tagAmharic: 'Popular',
    description: 'Recommended for regular creators who publish more often.',
    buttonLabel: 'Choose Plus',
    popular: true,
    features: [
      'Priority processing',
      'Karaoke caption support',
      'Perfect for frequent uploads',
    ],
  },
  {
    id: 'PRO',
    name: 'Pro',
    amharicName: 'Pro',
    priceEtb: 350,
    minutes: 40,
    credits: 250000,
    tag: 'Create Consistently',
    tagAmharic: 'Best Value',
    description: 'For creators who publish consistently and want a lower cost per video minute.',
    buttonLabel: 'Choose Pro',
    features: [
      'Ideal for YouTube and Reels',
      'Advanced export support',
      'Best value for regular creators',
    ],
  },
  {
    id: 'MAX',
    name: 'Agency',
    amharicName: 'Agency',
    priceEtb: 750,
    minutes: 100,
    credits: 650000,
    tag: 'Scale Your Production',
    tagAmharic: 'Agency',
    description: 'A high-volume option for agencies and teams producing content at scale.',
    buttonLabel: 'Choose Agency',
    features: [
      'High-volume team usage',
      'Priority support',
      'Built for agencies and brands',
    ],
  },
];

export interface PaymentAccount {
  name: string;
  amharicName: string;
  account: string;
  holder: string;
  color: string;
  badge: string;
  instruction: string;
}

export const OFFICIAL_PAYMENT_ACCOUNTS: PaymentAccount[] = [
  {
    name: 'Telebirr',
    amharicName: 'Telebirr',
    account: '0944093930',
    holder: 'Bgern AI / Bgern',
    color: 'bg-emerald-600',
    badge: 'Fastest',
    instruction: 'Send via Telebirr App or *127# to 0944093930 and enter the Transaction Reference (Tx Ref).',
  },
  {
    name: 'Commercial Bank of Ethiopia (CBE)',
    amharicName: 'Commercial Bank of Ethiopia (CBE)',
    account: '100043928174',
    holder: 'Bgern Captions',
    color: 'bg-purple-700',
    badge: 'CBE Birr / Mobile',
    instruction: 'Transfer via CBE Birr or CBE Mobile Banking to 100043928174 and enter the transaction code.',
  },
  {
    name: 'Bank of Abyssinia (BOA)',
    amharicName: 'Bank of Abyssinia (BOA)',
    account: '88912401',
    holder: 'Bgern Media',
    color: 'bg-amber-600',
    badge: 'Apollo / Mobile',
    instruction: 'Transfer via Bank of Abyssinia Mobile Banking to 88912401.',
  },
  {
    name: 'Awash Bank',
    amharicName: 'Awash Bank',
    account: '01304892185200',
    holder: 'Bgern Tech',
    color: 'bg-blue-600',
    badge: 'Direct Pay',
    instruction: 'Transfer via Awash Bank App to 01304892185200.',
  },
];

export function getPlanById(id: string): PricingPlan | undefined {
  return PRICING_PLANS.find((p) => p.id.toUpperCase() === id.toUpperCase());
}

export function calculateUsageDeduction(durationSeconds: number): {
  minutesToDeduct: number;
  creditsToDeduct: number;
} {
  const durationMinutes = Math.max(1, Math.ceil(durationSeconds / 60));
  const credits = durationMinutes * 6000;
  return {
    minutesToDeduct: durationMinutes,
    creditsToDeduct: credits,
  };
}

export const PACKAGES = PRICING_PLANS;
export const PAYMENT_ACCOUNTS = OFFICIAL_PAYMENT_ACCOUNTS;
