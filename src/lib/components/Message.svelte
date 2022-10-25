<script>
	export let message
</script>

<div class="flex flex-row">
	<p class="text-white text-opacity-50 mr-2 whitespace-nowrap">{new Date(message.timestamp).toLocaleTimeString()}</p>
	{#if message.server}
		<p class="text-gray-500 italic">{message.content}</p>
	{:else if message.pm}
		<p class="font-bold mr-2 whitespace-nowrap text-white">{message.username}</p>
		<p class="text-white text-opacity-50 italic">{message.content}</p>
	{:else}
		<p class="font-bold mr-2 whitespace-nowrap text-white">{message.username}</p>
		<p>{message.content}</p>
	{/if}
</div>
