export async function getMessageIds(conversationId: string, jwt: string) {
	const response = await fetch(`https://chatgpt.com/backend-api/conversation/${conversationId}`, {
		method: 'GET',
		headers: {
			Authorization: jwt,
			'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36'
		}
	})
	console.log('get conversation response', response)
	if (!response.ok) {
		console.log('get conversation error')
		return []
	}

	const messageIds = []
	const conversationResponse = (await response.json())
	const godMessage = Object.values(conversationResponse.mapping).find((it: any) => it.parent === null)

	let currentMessage = getNextAssistantMessage(godMessage)
	messageIds.push(currentMessage.id)
	while (currentMessage.children.length > 0) {
		currentMessage = getNextAssistantMessage(currentMessage)
		messageIds.push(currentMessage.id)
	}

	function getNextAssistantMessage(parentMessage: any) {
		let childMessageId = parentMessage.children[0]
		while (true) {
			const childMessage = conversationResponse.mapping[childMessageId]
			if (childMessage.message.author.role === 'assistant' && childMessage.message.content.content_type === 'text') {
				return childMessage
			} else {
				childMessageId = childMessage.children[0]
			}
		}
	}
	return messageIds
}