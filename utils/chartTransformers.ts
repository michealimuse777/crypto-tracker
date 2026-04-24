import type { ChartPoint, PortfolioRow } from '~/types'
import { getAssetConfig } from '~/utils/assetConfig'

const transformers = {
  allocation: (rows: PortfolioRow[]) => ({
    labels: rows.map((row) => row.name),
    datasets: [
      {
        data: rows.map((row) => Number(row.holdingsValue.toFixed(2))),
        backgroundColor: rows.map((row) => getAssetConfig(row.id).color),
        borderWidth: 0
      }
    ]
  }),
  performance: (points: ChartPoint[]) => ({
    labels: points.map((point) => point.label),
    datasets: [
      {
        label: 'Performance',
        data: points.map((point) => Number(point.value.toFixed(2))),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.18)',
        fill: true,
        tension: 0.35,
        borderWidth: 2.5,
        pointRadius: 0
      }
    ]
  })
}

export const transformAllocationChart = (rows: PortfolioRow[]) => transformers.allocation(rows)

export const transformPerformanceChart = (points: ChartPoint[]) => transformers.performance(points)

export const transformChart = (
  type: keyof typeof transformers,
  data: PortfolioRow[] | ChartPoint[]
) => transformers[type](data as never)
