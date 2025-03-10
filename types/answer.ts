export type Answer = {
  id: number
  answer: string
  username: string
  timestamp: string
  resetTimestamp?: string // Optional, nur für zurückgesetzte Antworten
}