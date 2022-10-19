<script>
	export let message,
		type,
		rank = 0

	const RANKS = {
		0: "text-white",
		1: "text-magenta-500",
	}
</script>

{#if type == 0}
	<div class="flex flex-row">
		<p class="text-white text-opacity-50 mr-2 whitespace-nowrap">{new Date(message.timestamp).toLocaleTimeString()}</p>
		<p class="font-bold mr-2 whitespace-nowrap {RANKS[rank]}">{message.username}</p>
		<p>{message.content}</p>
	</div>
{:else if type == 1}
	<div class="flex flex-row">
		<p class="text-white text-opacity-50 mr-2 whitespace-nowrap">{new Date(message.timestamp).toLocaleTimeString()}</p>
		<p class="text-gray-500 italic">{message.content}</p>
	</div>
{:else if type == 2}
	<div class="flex flex-row">
		<p class="text-white text-opacity-50 mr-2 whitespace-nowrap">{new Date(message.timestamp).toLocaleTimeString()}</p>
		<p class="font-bold mr-2 whitespace-nowrap {RANKS[rank]}">{message.username}</p>
		<p class="text-white text-opacity-50 italic">{message.content}</p>
	</div>
{/if}
