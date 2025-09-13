export type MessageItem = {
	id: string
	index: number
	status: 'pending' | 'finished' | 'error'
}

export type Voice = {
	display: string
	value: string
}