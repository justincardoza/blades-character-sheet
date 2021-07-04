window.addEventListener('DOMContentLoaded', function()
{
	//Custom component for the XP ticks.
	Vue.component('xp-ticks',
	{
		model: { prop: 'active', event: 'change' },
		props: ['max', 'active'],
		template: '<div class="xp-ticks"><div v-for="i in parseInt(max)" v-bind:key="i" v-bind:class="i <= active ? \'xp-tick-active\' : \'xp-tick-inactive\'" v-on:click="$emit(\'change\', i == active ? 0 : i)"></div></div>'
	});
	
	//Custom component for action ratings.
	Vue.component('action-rating', 
	{
		model: { prop: 'active', event: 'change' },
		props: ['name', 'active'],
		template: '<div class="action-rating">' + 
			'<div v-for="i in 4" v-bind:key="i" v-bind:class="[\'action-rating-bubble-wrapper\', i == 1 ? \'action-rating-bubble-first\' : null]">' +
				'<div v-bind:class="[\'action-rating-bubble\', i <= active ? \'action-rating-bubble-active\' : null]" v-on:click="$emit(\'change\', i == active ? 0 : i)">' + 
				'</div>' + 
			'</div>' +
			'<div class="action-rating-name">{{name}}</div>' + 
		'</div>',
	});
	
	//Custom component for traumas.
	Vue.component('trauma-select', 
	{
		model: { prop: 'active', event: 'change' },
		props: [ 'active', 'options' ],
		template: '<ul class="trauma-select">' + 
			'<li v-for="option in options" v-bind:class="(option in active && active[option]) ? \'trauma-active\' : null" v-on:click="toggleTrauma(option)">{{option}}</li>' +
		'</ul>',
		methods:
		{
			toggleTrauma: function(trauma)
			{
				var current = !!this.active[trauma];
				var newState = Object.assign({}, this.active);
				
				newState[trauma] = !current;
				this.$emit('change', newState);
			}
		},
	});
	
	//Custom component for the clocks for healing, projects, etc.
	//This was tricky. At first I tried to build it with absolute-positioned <div>s rotated to form the segments. That should be possible, 
	//and there are tutorials out there on the math required, but it'll be jury-rigged at best. This component uses a hybrid approach with a 
	//border radius of 50% to generate a circle, an SVG for the lines to separate the segments, and then a conic gradient on the <svg> element 
	//itself for the background. Note that when I wrote this (June 2021), SVG did not support conic gradients on shape elements, which is why 
	//I'm not using a <circle> directly for the border. It works okay with a <circle> and then the gradient on the <svg> container, but the 
	//background does spill out a little since the circle has to be a tiny bit smaller than the container to avoid the edges getting cut off.
	Vue.component('clock', 
	{
		model: { prop: 'active', event: 'change' },
		props: 
		{ 
			max: Number, 
			active: { type: Number, default: 0 },
			size: { type: Number, default: 20 },
		},
		methods: 
		{
			handleClick(event)
			{
				var rect = event.target.getBoundingClientRect();
				var offsetX = event.clientX - rect.x - (rect.width / 2);
				var offsetY = event.clientY - rect.y - (rect.height / 2);
				var angle = Math.atan2(offsetY, offsetX) + (Math.PI / 2);
				
				if(angle < 0) angle += Math.PI * 2;
				
				var value = Math.floor(angle / (Math.PI * 2) * this.max) + 1;
				
				this.$emit('change', value == this.active ? 0 : value);
			}
		},
		render: function(createElement)
		{
			var center = this.size / 2;
			var r = (this.size / 2);
			var outlines = [];
			var colorStops = [];
			
			for(var i = 1; i <= this.max; i++)
			{
				colorStops.push((i <= this.active ? '#a00' : '#fff') + ' ' + ((i - 1) / this.max) + 'turn ' + (i / this.max) + 'turn');
				
				outlines.push(createElement('line', 
				{ 
					attrs: 
					{ 
						x1: center, 
						y1: center, 
						x2: center + r * Math.sin((i - 1) / this.max * Math.PI * 2), //These are reversed to make sure one line is always pointing straight up.
						y2: center - r * Math.cos((i - 1) / this.max * Math.PI * 2), 
						stroke: 'black',
					} 
				}));
			}
			
			return createElement('svg', 
			{ 
				style: 'background: conic-gradient(' + colorStops.join(',') + ')' , 
				class: 'clock', 
				attrs: { width: this.size, height: this.size, viewBox: '0 0 ' + this.size + ' ' + this.size },
				on: { click: this.handleClick },
			}, 
			outlines);
		}
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
					crew: '',
					alias: '',
					look: '',
					heritageType: '',
					heritageDescription: '',
					backgroundType: '',
					backgroundDescription: '',
					viceType: '',
					viceDescription: '',
					stress: 0,
					traumas: {},
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
					insightXP: 0,
					prowessXP: 0,
					resolveXP: 0,
					actionRatings: { hunt: 0, study: 0, survey: 0, tinker: 0, finesse: 0, prowl: 0, skirmish: 0, wreck: 0, attune: 0, command: 0, consort: 0, sway: 0 },
					coin: 0,
					stash: [0, 0, 0, 0],
				};
				
				this.characters.push(character);
				this.currentCharacter = this.characters.length - 1;
			},
			
			deleteCharacter: function()
			{
				if(this.currentCharacter >= 0 && this.currentCharacter < this.characters.length)
				{
					if(window.confirm('Really delete character "' + this.characters[this.currentCharacter].fullName + '" (' + this.characters[this.currentCharacter].alias + ')?'))
					{
						this.characters.splice(this.currentCharacter, 1);
						
						if(this.currentCharacter >= this.characters.length) this.currentCharacter = this.characters.length - 1;
						if(this.currentCharacter < 0) this.addCharacter();
					}
				}
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
