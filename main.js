window.addEventListener('DOMContentLoaded', function()
{
	var app = new Vue({
		el: '#app',
		data: {
			currentCharacter: 0,
			
			characters: [
				{ 
					fullName: 'Baszo Baz', 
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
					
				}
			]
		},
	});
});
