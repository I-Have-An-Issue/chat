<script>
	import { browser } from "$app/environment"
	import { page } from "$app/stores"

	export let chats = []
	let valid = true,
		connected = false,
		value = "",
		chatbox,
		socket,
		socketUrl = `ws${$page.url.protocol == "https:" ? "s" : ""}://${$page.url.host}/`,
		target

	function onInput() {
		if (value.length > 100) valid = false
		else valid = true
	}

	function sendMessage() {
		if (value.length == 0 || !connected || !valid) return
		socket.send(JSON.stringify({ content: value }))
		value = ""
	}

	function newServerMessage(content) {
		return newMessage(Date.now(), "[Server]", content)
	}

	function newMessage(ms, username, content) {
		chats.push({ timestamp: ms, username, content })
		chats = chats
		target.scrollIntoView()
	}

	if (browser) {
		socket = new WebSocket(socketUrl)

		socket.addEventListener("open", () => (connected = true))
		socket.addEventListener("error", (error) => console.log(error))

		socket.addEventListener("close", () => {
			connected = false
			newServerMessage("You have lost connection to the chatroom.")
		})

		socket.addEventListener("message", ({ data }) => {
			const json = JSON.parse(data.toString())

			switch (json.type) {
				case "SERVER_MESSAGE":
					newServerMessage(json.content)
					break
				case "USER_MESSAGE":
					newMessage(new Date(json.timestamp).getTime(), json.author, json.content)
					break
				default:
					console.log(json)
					break
			}
		})
	}
</script>

<div class="mx-auto max-w-4xl p-4 border-2 border-gray-200 rounded-lg divide-y">
	<div class="flex flex-col h-[30rem] overflow-auto" bind:this={chatbox}>
		{#each chats as message}
			<div class="flex flex-row">
				<p class="text-black text-opacity-50 mr-2 whitespace-nowrap">{new Date(message.timestamp).toLocaleTimeString()}</p>
				<p class="font-bold mr-2 whitespace-nowrap">{message.username}</p>
				<p>{message.content}</p>
			</div>
		{:else}
			<div class="flex flex-row">
				<p class="text-black text-opacity-50 mr-2 whitespace-nowrap">{new Date().toLocaleTimeString()}</p>
				<p class="font-bold mr-2 whitespace-nowrap">{"[Server]"}</p>
				<p>Connecting to the chatroom...</p>
			</div>
		{/each}
		<div class="flex flex-row select-none text-white" bind:this={target}>
			<p class="mr-2 whitespace-nowrap">{new Date().toLocaleTimeString()}</p>
			<p class="font-bold mr-2 whitespace-nowrap">{"[Server]"}</p>
			<p>Filler text</p>
		</div>
	</div>
	<form on:submit|preventDefault={sendMessage} class="flex pt-3">
		<input class="h-10 w-full px-2 rounded border-2 border-grey-300" type="text" id="message" autocomplete="off" bind:value on:input={onInput} />
		<button class="px-2 rounded ml-2 border-2 border-blue-500 {valid || connected ? 'text-blue-500 hover:bg-blue-500 hover:bg-opacity-30' : 'text-blue-100 border-blue-100 pointer-events-none'}">Send</button>
	</form>
</div>
