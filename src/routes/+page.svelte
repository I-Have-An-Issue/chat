<script>
	import Message from "$lib/components/Message.svelte"
	import { browser } from "$app/environment"
	import { page } from "$app/stores"

	export let chats = []
	let valid = true,
		connected = false,
		value = "",
		chatbox,
		socket,
		socketUrl = `ws${$page.url.protocol == "https:" ? "s" : ""}://${$page.url.host}/`,
		target,
		users = []

	function onInput() {
		if (value.length > 100) valid = false
		else valid = true
	}

	function sendMessage() {
		if (value.length == 0 || !connected || !valid) return
		socket.send(JSON.stringify({ content: value }))
		value = ""
	}

	function newServerMessage(content, type) {
		return newMessage(Date.now(), null, content, type)
	}

	function newMessage(ms, username, content, type) {
		chats.push({ timestamp: ms, username, content, type: type || 0 })
		chats = chats
		target.scrollIntoView()
	}

	if (browser) {
		socket = new WebSocket(socketUrl)

		socket.addEventListener("open", () => {
			connected = true
			users = []
		})
		socket.addEventListener("error", (error) => console.log(error))

		socket.addEventListener("close", () => {
			connected = false
			newServerMessage("You have lost connection to the chatroom.", 3)
		})

		socket.addEventListener("message", ({ data }) => {
			const json = JSON.parse(data.toString())

			switch (json.type) {
				case "SERVER_MESSAGE":
					newServerMessage(json.content, json.color)
					break
				case "USER_MESSAGE":
					newMessage(new Date(json.timestamp).getTime(), json.author, json.content)
					break
				case "USER_ADD":
					users.push(json.name)
					users = users
					break
				case "USER_REMOVE":
					users.pop(json.name)
					users = users
					break
				default:
					console.log(json)
					break
			}
		})
	}
</script>

<div class="grid grid-rows-1 grid-cols-7 w-full h-full gap-x-2">
	<div class="w-full divide-y-2 divide-zinc-700 flex flex-col col-span-6">
		<div class="flex flex-col overflow-auto flex-grow" bind:this={chatbox}>
			{#each chats as message}
				<Message {message} type={message.type} />
			{:else}
				<Message message={{ timestamp: Date.now(), content: "Connecting to the chatroom..." }} type={1} />
			{/each}
			<span class="h-6" bind:this={target} />
		</div>
		<form on:submit|preventDefault={sendMessage} class="flex pt-3 mt-2">
			<input class="h-10 w-full px-2 rounded border-2 border-zinc-700 bg-zinc-800" type="text" id="message" autocomplete="off" bind:value on:input={onInput} />
			<button
				class="px-6 text-lg font-bold rounded ml-2 border-2 border-blue-500 {valid && connected
					? 'text-blue-500 hover:bg-blue-500 hover:bg-opacity-30'
					: 'text-blue-300 border-blue-300 text-opacity-50 border-opacity-50 pointer-events-none'}"
			>
				Send
			</button>
		</form>
	</div>
	<div class="bg-zinc-800 p-2 w-full flex flex-col userlist">
		{#each users as username}
			<p class="font-bold">{username}</p>
		{/each}
	</div>
</div>
