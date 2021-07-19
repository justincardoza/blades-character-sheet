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
	
	//Custom component for coin amount indicators. Same logic as XP ticks, just different styling. These could be rolled into one component type at some point.
	Vue.component('coin-indicator',
	{
		model: { prop: 'active', event: 'change' },
		props: ['max', 'active'],
		template: 
		'<div class="coin-indicator">' + 
			'<div v-for="i in parseInt(max)" v-bind:key="i" v-bind:class="i <= active ? \'coin-active\' : \'coin-inactive\'" v-on:click="$emit(\'change\', i == active ? 0 : i)">' +
			'</div>' + 
		'</div>'
	})
	
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
			max: { default: 4 }, 
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
			showMenu: false,
		},
		
		computed:
		{
			//Calculates the character's current load level based on the items they are currently carrying.
			currentLoad: function()
			{
				if(this.currentCharacter >= 0 && this.currentCharacter < this.characters.length)
				{
					return this.characters[this.currentCharacter].items.reduce(function(total, item) { return item.held ? parseInt(item.loadSlots) + total : total; }, 0);
				}
				
				return 0;
			},
			
			//Returns a CSS class for the equipment load indicator.
			loadClass: function()
			{
				if(this.currentCharacter >= 0 && this.currentCharacter < this.characters.length)
				{
					if(this.currentLoad > this.characters[this.currentCharacter].maxLoad) return 'overloaded';
					else if(this.currentLoad == this.characters[this.currentCharacter].maxLoad) return 'fully-loaded';
				}
				
				return null;
			},
			
			//Returns a data URI for downloading the character data.
			dataURI: function()
			{
				return 'data:text/json;base64,' + window.btoa(JSON.stringify(this.characters));
			}
		},
		
		//When the app is created, immediately try to load any existing data. If there is none,
		//create a new character so there's something to display.
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
			}
			
			if(!this.currentCharacter) this.currentCharacter = 0;
			if(!this.characters) this.addCharacter();
			
			document.getElementById('data-import').style.opacity = 0;
		},
		
		methods:
		{
			//Adds a new character and opens that character sheet.
			addCharacter: function()
			{
				var character = 
				{
					fullName: 'New Character',
					crew: '',
					alias: '',
					look: '',
					playbook: '',
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
					maxLoad: 3,
					items: [],
					projects: [],
				};
				
				if(!Array.isArray(this.characters)) this.characters = [];
				this.characters.push(character);
				this.currentCharacter = this.characters.length - 1;
				this.showMenu = false;
			},
			
			//Deletes the current character.
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
			},
			
			//Adds a new harm to the current character.
			addHarm: function()
			{
				if(this.currentCharacter >= 0 && this.currentCharacter < this.characters.length)
				{
					var harm = { level: '1', description: '', effect: '', };
					
					if(Array.isArray(this.characters[this.currentCharacter].harms))
					{
						this.characters[this.currentCharacter].harms.push(harm);
					}
					else
					{
						this.characters[this.currentCharacter].harms = [harm];
					}
				}
			},
			
			//Sorts a character's harms by level in descending order.
			sortHarms: function()
			{
				if(this.currentCharacter >= 0 && this.currentCharacter < this.characters.length)
				{
					this.characters[this.currentCharacter].harms.sort(function(a, b)
					{
						if(b.level > a.level) return 1;
						else if(b.level < a.level) return -1;
						else return 0;
					});
				}
			},
			
			//Deletes a specific harm.
			deleteHarm: function(index)
			{
				if(this.currentCharacter >= 0 && this.currentCharacter < this.characters.length && index >= 0 && index < this.characters[this.currentCharacter].harms.length)
				{
					if(window.confirm('Are you sure you want to remove level ' + this.characters[this.currentCharacter].harms[index].level + ' harm "' + this.characters[this.currentCharacter].harms[index].description + '"?'))
					{
						this.characters[this.currentCharacter].harms.splice(index, 1);
					}
				}
			},
			
			//Drops the level of all harms by 1, removing any that have gone below 1, then resets the healing clock.
			healHarms: function()
			{
				if(this.currentCharacter >= 0 && this.currentCharacter < this.characters.length && this.characters[this.currentCharacter].healingClock >= 4)
				{
					this.characters[this.currentCharacter].harms = this.characters[this.currentCharacter].harms.map(function(harm)
					{
						return { level: harm.level - 1, description: harm.description, effect: harm.effect };
					}).filter(function(harm)
					{
						return harm.level > 0;
					});
					
					this.characters[this.currentCharacter].healingClock -= 4;
				}
			},
			
			//Adds a new blank special ability to the current character.
			addSpecialAbility: function()
			{
				if(this.currentCharacter >= 0 && this.currentCharacter < this.characters.length)
				{
					this.characters[this.currentCharacter].specialAbilities.push('');
					this.characters[this.currentCharacter].specialAbilityXP -= 8;
				}
			},
			
			//Deletes a special ability from the current character.
			deleteSpecialAbility: function(index)
			{
				if(this.currentCharacter >= 0 && this.currentCharacter < this.characters.length && index >= 0 && index < this.characters[this.currentCharacter].specialAbilities.length)
				{
					if(window.confirm('Are you sure you want to remove this special ability?'))
					{
						this.characters[this.currentCharacter].specialAbilities.splice(index, 1);
					}
				}
			},
			
			//Adds an item to a character's sheet.
			addItem: function()
			{
				if(this.currentCharacter >= 0 && this.currentCharacter < this.characters.length)
				{
					var item = { held: false, itemName: '', loadSlots: 1 };
					
					if(Array.isArray(this.characters[this.currentCharacter].items))
						this.characters[this.currentCharacter].items.push(item);
					else
						this.characters[this.currentCharacter].items = [item];
				}
			},
			
			//Deletes a specific item from the current character sheet.
			deleteItem: function(index)
			{
				if(this.currentCharacter >= 0 && this.currentCharacter < this.characters.length && index >= 0 && index < this.characters[this.currentCharacter].items.length)
				{
					this.characters[this.currentCharacter].items.splice(index, 1);
				}
			},
			
			//Adds a project for the current character.
			addProject: function()
			{
				if(this.currentCharacter >= 0 && this.currentCharacter < this.characters.length)
				{
					var project = { projectName: '', description: '', progress: 0, clockSegments: 4 };

					if(Array.isArray(this.characters[this.currentCharacter].projects))
						this.characters[this.currentCharacter].projects.push(project);
					else
						this.characters[this.currentCharacter].projects = [project];
					
					console.log(this.characters[this.currentCharacter].projects);
				}
			},
			
			//Shows or hides the character select menu.
			toggleMenu: function(event)
			{
				this.showMenu = !this.showMenu;
				if(event) event.preventDefault();
			},
			
			//Selects a particular character and hides the character select menu.
			selectCharacter: function(index)
			{
				this.currentCharacter = index;
				this.showMenu = false;
			},
			
			//Imports the character data from a JSON file.
			importData: function()
			{
				var files = document.getElementById('data-import').files;
				
				if(files.length > 0)
				{
					var reader = new FileReader();
					
					reader.onload = function(event)
					{
						this.characters = JSON.parse(reader.result);
						this.currentCharacter = 0;
					}
					
					reader.readAsText(files[0]);
				}
			},
		}
	});
	
	//Saves the character data to local storage.
	function saveCharacters()
	{
		localStorage.setItem('characters', JSON.stringify(app.characters));
		app.saveTimer = null;
	}
	
	//Sets a timer to save character data.
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
