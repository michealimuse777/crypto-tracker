const assetConfig = {
  bitcoin: {
    color: '#F7931A',
    category: 'store-of-value'
  },
  ethereum: {
    color: '#627EEA',
    category: 'smart-contract'
  },
  solana: {
    color: '#14F195',
    category: 'high-throughput'
  },
  chainlink: {
    color: '#2A5ADA',
    category: 'oracle'
  }
} as const

const fallbackConfig = {
  color: '#3B82F6',
  category: 'general'
}

export const getAssetConfig = (id: string) => assetConfig[id as keyof typeof assetConfig] ?? fallbackConfig
