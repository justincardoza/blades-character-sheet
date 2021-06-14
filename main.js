window.addEventListener('DOMContentLoaded', function()
{
	//Custom component for the XP ticks.
	Vue.component('xp-ticks',
	{
		model: { prop: 'active', event: 'change' },
		props: ['max', 'active'],
		template: '<div class="xp-ticks"><div v-for="i in parseInt(max)" v-bind:class="i <= active ? \'xp-tick-active\' : \'xp-tick-inactive\'" v-on:click="$emit(\'change\', i == active ? 0 : i)"></div></div>'
	});
	
	var app = new Vue({
		el: '#app',
		data: {
			saveTimer: null,
			errorMessage: null,
			currentCharacter: 0,
			characters: [],
		},
		
		created: function()
		{
			try
			{
				this.characters = JSON.parse(localStorage.getItem('characters'));
				this.currentCharacter = parseInt(localStorage.getItem('currentCharacter'));
			}
			catch(error)
			{
				this.errorMessage = error.message;
				this.addCharacter();
			}
		},
		
		methods:
		{
			addCharacter: function()
			{
				var character = 
				{
					fullName: 'New Character',
					alias: '',
					look: '',
					heritageType: '',
					heritageDescription: '',
					backgroundType: '',
					backgroundDescription: '',
					viceType: '',
					viceDescription: '',
					stress: 0,
					traumas: [],
					harms: [],
					healingClock: 0,
					usesArmor: false,
					usesHeavyArmor: false,
					usesSpecialArmor: false,
					xpChallengeType: '',
					friends: [],
					enemies: [],
					specialAbilities: [],
					specialAbilityXP: 0,
					coin: 0,
					stash: [0, 0, 0, 0],
				};
				
				this.characters.push(character);
				this.currentCharacter = this.characters.length - 1;
			}
		}
	});
	
	function saveCharacters()
	{
		localStorage.setItem('characters', JSON.stringify(app.characters));
		app.saveTimer = null;
	}
	
	function queueSaveCharacters()
	{
		if(app.saveTimer) clearTimeout(app.saveTimer);
		app.saveTimer = setTimeout(saveCharacters, 2000);
	}
	
	//Save the current character selection immediately on change.
	app.$watch('currentCharacter', function() { localStorage.setItem('currentCharacter', app.currentCharacter) });
	
	//Queue up character data changes to wait a couple of seconds before saving.
	app.$watch('characters', queueSaveCharacters, { deep: true });
});
