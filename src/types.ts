export type MessageItem = {
  id: string
  index: number
  status: 'pending' | 'finished' | 'error'
}