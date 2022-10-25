<script>
	import { browser } from "$app/environment"
	import { page } from "$app/stores"
	import { handler } from "$lib/handler.js"
	import { messages } from "$lib/stores/messages.js"
	import { users } from "$lib/stores/users.js"
	import Message from "$lib/components/Message.svelte"

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

	if (browser) {
		socket = new WebSocket(socketUrl)
		socket.addEventListener("error", (error) => console.log(error))
		socket.addEventListener("message", ({ data }) => handler(JSON.parse(data.toString()), socket))
		socket.addEventListener("open", () => (connected = true))
		socket.addEventListener("close", () => {
			connected = false
			handler({
				type: "MESSAGE",
				data: {
					content: "You have lost connection to the chatroom. Please refresh to reconnect.",
					timestamp: Date.now(),
					server: true,
				},
			})
		})
	}
</script>

<div class="grid grid-rows-1 grid-cols-7 w-full h-full gap-x-2">
	<div class="w-full divide-y-2 divide-zinc-700 flex flex-col col-span-6">
		<div class="flex flex-col overflow-auto flex-grow" bind:this={chatbox}>
			{#each $messages as message}
				<Message {message} />
			{:else}
				<Message message={{ server: true, timestamp: Date.now(), content: "Connecting to the chatroom..." }} />
			{/each}
			<span class="h-6 flex-none" bind:this={target} />
		</div>
		<form on:submit|preventDefault={sendMessage} class="flex pt-3 mt-2">
			<input class="h-10 w-full px-2 rounded border-2 border-zinc-700 bg-zinc-800" type="text" id="message" autocomplete="off" bind:value on:input={onInput} />
			<button
				class="px-6 text-lg font-bold rounded ml-2 border-2 {valid && connected
					? 'text-blue-500 border-blue-500 hover:bg-blue-500 hover:bg-opacity-30'
					: 'text-blue-300 border-blue-300 text-opacity-50 border-opacity-50 pointer-events-none'}"
			>
				Send
			</button>
		</form>
	</div>
	<div class="bg-zinc-800 p-2 w-full flex flex-col userlist rounded-lg">
		{#each $users as user}
			<p class="font-bold">{user}</p>
		{/each}
	</div>
</div>
