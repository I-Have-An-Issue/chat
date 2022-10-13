<script>
	export let message, type

	const RANKS = {
		0: "text-white",
		1: "text-magenta-500",
	}
</script>

{#if type == 0}
	<div class="flex flex-row">
		<p class="text-white text-opacity-50 mr-2 whitespace-nowrap">{new Date(message.timestamp).toLocaleTimeString()}</p>
		<p class="font-bold mr-2 whitespace-nowrap text-white">{message.username}</p>
		<p>{message.content}</p>
	</div>
{:else if type == 1}
	<div class="flex flex-row">
		<p class="text-white text-opacity-50 mr-2 whitespace-nowrap">{new Date(message.timestamp).toLocaleTimeString()}</p>
		<p class="font-bold mr-2 whitespace-nowrap text-blue-500">Server</p>
		<p class="text-blue-500">{message.content}</p>
	</div>
{:else if type == 2}
	<div class="flex flex-row">
		<p class="text-white text-opacity-50 mr-2 whitespace-nowrap">{new Date(message.timestamp).toLocaleTimeString()}</p>
		<p class="font-bold mr-2 whitespace-nowrap text-orange-500">Server</p>
		<p class="text-orange-500">{message.content}</p>
	</div>
{:else if type == 3}
	<div class="flex flex-row">
		<p class="text-white text-opacity-50 mr-2 whitespace-nowrap">{new Date(message.timestamp).toLocaleTimeString()}</p>
		<p class="font-bold mr-2 whitespace-nowrap text-red-500">Server</p>
		<p class="text-red-500">{message.content}</p>
	</div>
{/if}
