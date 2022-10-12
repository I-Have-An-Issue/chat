<script>
	import { browser } from "$app/environment"
	import { page } from "$app/stores"
	import { onMount } from "svelte"

	export let chats = []
	let valid = true,
		connected = false,
		username,
		value = "",
		chatbox,
		socket

	function onInput() {
		if (value.length > 50) valid = false
		else valid = true
	}

	function sendMessage() {
		if (value.length == 0 || !connected) return
		if (!username && new RegExp(/[^A-Za-z0-9_]/g).test(value)) return newMessage(Date.now(), "Server", "Usernames can only be letters, numbers, and underscores.")
		if (!username) {
			username = value
			socket.send(JSON.stringify({ timestamp: Date.now(), username, content: "has joined the chatroom." }))
			value = ""
			return newServerMessage(`Logged in.`)
		}

		socket.send(JSON.stringify({ timestamp: Date.now(), username, content: value }))
		newMessage(Date.now(), username, value)
		value = ""
	}

	function newServerMessage(content) {
		return newMessage(Date.now(), "[Server]", content)
	}

	function newMessage(ms, username, content) {
		chats.push({ timestamp: ms, username, content })
		chats = chats
		chatbox.scrollTop = chatbox.scrollHeight
	}

	if (browser) {
		socket = new WebSocket(`ws://${$page.url.host}/`)

		socket.addEventListener("open", () => {
			connected = true
			newServerMessage("Connected.")
			newServerMessage("Set a username to enter the chatroom.")
		})

		socket.addEventListener("close", () => {
			connected = false
			newServerMessage("You have lost connection to the chatroom.")
		})

		socket.addEventListener("error", (error) => {
			console.log(error)
		})

		socket.addEventListener("message", ({ data }) => {
			if (!username) return
			const json = JSON.parse(data.toString())
			newMessage(new Date(json.timestamp).getTime(), json.username, json.content)
		})
	}

	onMount(() => {
		newServerMessage("Connecting...")
	})
</script>

<div class="mx-auto max-w-lg p-4 border-2 border-gray-200 rounded-lg divide-y">
	<div class="flex flex-col h-[30rem] overflow-auto pb-1" bind:this={chatbox}>
		{#each chats as message}
			<div class="flex flex-row">
				<p class="text-black text-opacity-50 mr-2 whitespace-nowrap">{new Date(message.timestamp).toLocaleTimeString()}</p>
				<p class="font-bold mr-2 whitespace-nowrap">{message.username}</p>
				<p class="">{message.content}</p>
			</div>
		{/each}
	</div>
	<form on:submit|preventDefault={sendMessage} class="pt-3 flex">
		<input class="h-10 w-full px-2 rounded border-2 border-grey-300" type="text" id="message" bind:value on:input={onInput} />
		<button class="px-2 rounded ml-2 border-2 border-blue-500 {valid ? 'text-blue-500 hover:bg-blue-500 hover:bg-opacity-30' : 'text-blue-100 border-blue-100 pointer-events-none'}">Send</button>
	</form>
</div>
