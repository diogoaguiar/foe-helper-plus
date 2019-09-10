/*
 * **************************************************************************************
 *
 * Dateiname:                 productions.js
 * Projekt:                   foe
 *
 * erstellt von:              Daniel Siekiera <daniel.siekiera@gmail.com>
 * zu letzt bearbeitet:       09.09.19, 10:21 Uhr
 *
 * Copyright © 2019
 *
 * **************************************************************************************
 */

Productions = {

	BuildingsAll: [],
	BuildingsProducts: [],
	BuildingsProductsGroups: [],

	BuildingTypes: {
		greatbuilding: i18n.Boxes.Productions.Headings.greatbuilding,
		production : i18n.Boxes.Productions.Headings.production,
		random_production : i18n.Boxes.Productions.Headings.random_production,
		residential : i18n.Boxes.Productions.Headings.residential,
		main_building : i18n.Boxes.Productions.Headings.main_building,
	},

	Tabs: [],
	TabsContent: [],

	Types: [
		'strategy_points',	// Forge Punkte
		'money',			// Münzen
		'supplies',			// Werkzeuge
		'medals',			// Medaillien
		'packaging',		// Güter Gruppe (5 verschieden z.B.)
	],

	Buildings: [
		'greatbuilding',
		'residential',
		'random_production',
		'production',
		'main_building'
	],

	/**
	 *  Start der ganzen Prozedur
	 */
	init: ()=> {

		moment.locale('de');
		Productions.Tabs = [];

		Productions.entities = Productions.GetSavedData();

		// leere Arrays erzeugen
		for(let i in Productions.Types)
		{
			if(Productions.Types.hasOwnProperty(i))
			{
				Productions.BuildingsProducts[ Productions.Types[i] ] = [];
				if(Productions.Types[i] === 'packaging')
				{
					continue;
				}
				Productions.BuildingsProductsGroups[ Productions.Types[i] ] = [];
			}
		}

		Productions.ReadData();
	},


	/**
	 * ALle Gebäude aus dem Cache holen
	 *
	 * @returns {any}
	 * @constructor
	 */
	GetSavedData: ()=> {
		return CityMapData;
	},


	/**
	 * Alle Gebäude durchsteppen
	 *
	 * @constructor
	 */
	ReadData: ()=>{

		let d = Productions.entities;

		for(let i in d)
		{
			if (d.hasOwnProperty(i) && d[i]['id'] < 2000000000)
			{
				// jede einzelne Produktart holen
				let building = Productions.ReadBuildings(d[i]);

				// das Gebäude produziert etwas?
				if(building !== false){

					/*
					// "Alle" - prüfen ob es noch nicht im Array ist
					let check = Productions.BuildingsAll.map((el) => el.eid).indexOf(building['eid']);
					if(check === -1)
					{
						Productions.BuildingsAll.push(building);
					}
					*/
					Productions.BuildingsAll.push(building);

					// Nach Produkt
					for(let x in building['products'])
					{
						if(building['products'].hasOwnProperty(x))
						{
							if(Productions.Types.includes(x))
							{
								// Alle Gebäude einzeln auflisten, nach Produkt sortiert
								Productions.BuildingsProducts[x].push(building);

								if(x !== 'packaging')
								{
									let index = Productions.BuildingsProductsGroups[x].map((el) => el.eid).indexOf(building['eid']);

									// Alle Gebäude gruppieren und
									if(index === -1){
										let ni = Productions.BuildingsProductsGroups[x].length +1;

										Productions.BuildingsProductsGroups[x][ni] = [];
										Productions.BuildingsProductsGroups[x][ni]['name'] = building['name'];
										Productions.BuildingsProductsGroups[x][ni]['eid'] = building['eid'];
										Productions.BuildingsProductsGroups[x][ni]['products'] = parseInt(building['products'][x]);
										Productions.BuildingsProductsGroups[x][ni]['count'] = 1;

									} else {
										Productions.BuildingsProductsGroups[x][index]['products'] += parseInt(building['products'][x]);
										Productions.BuildingsProductsGroups[x][index]['count']++;
									}
								}
							}

							else {
								let mId = d[i]['cityentity_id'] + '_' + d[i]['id'];

								if(Array.isArray(Productions.BuildingsProducts['packaging'][mId]) === false)
								{
									Productions.BuildingsProducts['packaging'][mId] = [];
									Productions.BuildingsProducts['packaging'][mId]['at'] = building['at'];
									Productions.BuildingsProducts['packaging'][mId]['id'] = building['id'];
									Productions.BuildingsProducts['packaging'][mId]['name'] = building['name'];
									Productions.BuildingsProducts['packaging'][mId]['type'] = building['type'];
									Productions.BuildingsProducts['packaging'][mId]['products'] = [];
								}

								Productions.BuildingsProducts['packaging'][mId]['products'][x] = building['products'][x];
							}
						}
					}
				}
			}
		}

		Productions.showBox();
	},


	/**
	 * Prüfung ob das Gebäude etwas produziert
	 *
	 * @param d
	 * @returns {*}
	 * @constructor
	 */
	ReadBuildings: (d)=> {

		if(	d.state !== undefined &&
			d.state.current_product !== undefined &&
			d.state.current_product.product !== undefined &&
			d.state.current_product.product.resources !== undefined
		){
			return Productions.readType(d);
		}

		return false;
	},


	/**
	 * alle Produkte auslesen
	 *
	 * @param d
	 * @returns {{eid: *, at: *, in: *, name: *, id: *, type: *, products: *}}
	 */
	readType: (d)=> {

		let products = [];

		let a = d['state']['current_product']['product']['resources'];

		for(let k in a) {
			if(a.hasOwnProperty(k)) {
				products[k] = a[k];
			}
		}

		return {
			name: BuildingNamesi18n[d['cityentity_id']]['name'],
			products: products,
			id: d['id'],
			eid: d['cityentity_id'],
			at: d['state']['next_state_transition_at'],
			in: d['state']['next_state_transition_in'],
			type: d['type']
		};
	},


	/**
	 * HTML Box erstellen und einblenden
	 */
	showBox: ()=>{

		if( $('#Productions').length > 0 ){
			return ;
		}

		HTML.Box('Productions', i18n['Boxes']['Productions']['Title']);

		let h = [];

		h.push('<div class="tabs">');


		// einzelne Güterarten durchsteppen
		for(let pt in Productions.Types)
		{
			let type = Productions.Types[pt];

			if(Productions.BuildingsProducts.hasOwnProperty(type))
			{
				Productions.SetTabs(type);

				Productions.BuildingsProducts[type] = helper.arr.multisort(Productions.BuildingsProducts[type], ['name'], ['ASC']);

				if(type !== 'packaging')
				{
					Productions.BuildingsProductsGroups[type] = helper.arr.multisort(Productions.BuildingsProductsGroups[type], ['name'], ['ASC']);
				}


				let buildings = Productions.BuildingsProducts[type],
					groups = Productions.BuildingsProductsGroups[type],
					table = [],
					rowA = [],
					rowB = [],
					countProducts = [],
					countAll = 0;

				for(let i in buildings)
				{
					if(buildings.hasOwnProperty(i))
					{
						if(type !== 'packaging')
						{
							countAll += parseInt(buildings[i]['products'][type]);

							let tds = '<tr>' +
								'<td>' + buildings[i]['name'] + '</td>' +
								'<td class="text-right">' + Number(buildings[i]['products'][type]).toLocaleString('de-DE') + '</td>' +
								'<td class="wsnw">' + moment.unix(buildings[i]['at']).format('DD.MM.YYYY HH:mm') + ' Uhr</td>' +
								'<td>' + moment.unix(buildings[i]['at']).fromNow() + '</td>' +
								'</tr>';

							rowA.push(tds);
						}

						// nur Gebäude mit Gütern
						else {

							let tds = '<tr><td>' + buildings[i]['name'] + '</td>';

							let pA = [];

							for(let p in buildings[i]['products'])
							{
								if(buildings[i]['products'].hasOwnProperty(p) && Productions.Types.includes(p) === false)
								{
									if(countProducts[p] === undefined)
									{
										countProducts[p] = 0;
									}

									countProducts[p] += buildings[i]['products'][p];
									countAll += buildings[i]['products'][p];

									pA.push(Number(buildings[i]['products'][p]).toLocaleString('de-DE') + ' ' + GoodsNames[p]);
								}
							}

							tds +='<td>' + pA.join('<br>') + '</td>' +
								'<td>' + moment.unix(buildings[i]['at']).format('DD.MM.YYYY HH:mm') + ' Uhr</td>' +
								'<td>' + moment.unix(buildings[i]['at']).fromNow() + '</td>' +
								'</tr>';

							rowA.push(tds);

							countProducts.filter(val => val);

						}
					}
				}

				// Gruppierte Ansicht
				if(type !== 'packaging') {

					for (let i in groups) {
						if (groups.hasOwnProperty(i)) {
							let tds = '<tr>' +
								'<td colspan="1" class="text-right">' + groups[i]['count'] + 'x </td>' +
								'<td colspan="2">' + groups[i]['name'] + '</td>' +
								'<td colspan="1">' + Number(groups[i]['products']).toLocaleString('de-DE') + '</td>' +
								'</tr>';

							rowB.push(tds);
						}
					}
				}

				table.push('<table class="foe-table sortable-table">');

				if(Productions.isEmpty(countProducts) === false)
				{
					table.push('<tbody>');

					table.push('<tr><td colspan="4" class="all-products">');

					for(let ca in countProducts)
					{
						if(countProducts.hasOwnProperty(ca))
						{
							table.push('<span>' + GoodsNames[ca] +' <strong>' + Number(countProducts[ca]).toLocaleString('de-DE') + '</strong></span>');
						}
					}

					table.push('</td>');
					table.push('</tr>');
					table.push('<tr><td></td><td class="total-products"><strong>Gesamt: ' + Number(countAll).toLocaleString('de-DE') + '</strong></td><td colspan="2"></td></tr>');
				}

				else {
					table.push('<thead>');
					table.push('<tr class="other-header">');
					table.push('<th colspan="2"><span class="change-view game-cursor" data-type="' + type + '">' + i18n['Boxes']['Productions']['ModeGroups'] + '</span></th>');
					table.push('<th colspan="2" class="text-right"><strong>' + GoodsNames[type] + ': ' + Number(countAll).toLocaleString('de-DE') + '</strong></th>');
					table.push('</tr>');

					table.push('</thead>');
					table.push('<tbody class="' + type + '-mode ' + type + '-single">');

					// Sortierung
					table.push('<tr class="sorter-header">');
					table.push('<th class="ascending game-cursor" data-type="' + type + '-single">Name</th>');
					table.push('<th class="is-number game-cursor text-right" data-type="' + type + '-single">Menge</th>');
					table.push('<th class="no-sort">&nbsp;</th>');
					table.push('<th class="no-sort">&nbsp;</th>');
					table.push('</tr>');

				}

				table.push( rowA.join('') );
				table.push('</tbody>');

				// Gruppierte Ansicht drunter
				if(Productions.isEmpty(rowB) === false)
				{
					table.push('<tbody class="' + type + '-mode ' + type + '-groups" style="display:none">');

					// Sortierung
					table.push('<tr class="sorter-header">');
					table.push('<th class="game-cursor text-right" data-type="' + type + '-groups">Anzahl</th>');
					table.push('<th class="ascending game-cursor" colspan="2" data-type="' + type + '-groups">Name</th>');
					table.push('<th class="is-number game-cursor" data-type="' + type + '-groups">Menge</th>');
					table.push('</tr>');

					table.push( rowB.join('') );
					table.push('</tbody>');
				}

				table.push('</table>');

				Productions.SetTabContent(type, table.join(''));
			}
		}


		// alles auf einmal ausgeben
		Productions.BuildingsAll = helper.arr.multisort(Productions.BuildingsAll, ['name'], ['ASC']);
		Productions.SetTabs('all');

		let building = Productions.BuildingsAll,
			TableAll = [],
			rowC = [];

		for(let i in building)
		{
			if(building.hasOwnProperty(i))
			{
				rowC.push('<tr class="' + building[i]['type'] + '">');
				rowC.push('<td>' + building[i]['name'] + '</td>');

				let pA = [],
					prod = building[i]['products'];

				for(let p in prod)
				{
					if(prod.hasOwnProperty(p))
					{
						pA.push(Number(prod[p]).toLocaleString('de-DE') + ' ' + GoodsNames[p]);
					}
				}

				rowC.push('<td>' + pA.join('<br>') + '</td>');

				rowC.push('<td>' + moment.unix(building[i]['at']).format('DD.MM.YYYY HH:mm') + ' Uhr</td>');
				rowC.push('<td>' + moment.unix(building[i]['at']).fromNow() + '</td>');
				rowC.push('</tr>');
			}
		}

		TableAll.push('<table class="foe-table">');

		TableAll.push('<thead>');
		TableAll.push('<tr>');
		TableAll.push('<th><input type="text" id="all-search" placeholder="' + i18n['Boxes']['Productions']['SearchInput'] + '" onkeyup="Productions.Filter()"></th>');
		TableAll.push('<th class="text-right" id="all-dropdown-th"></th>');
		TableAll.push('</tr>');
		TableAll.push('</thead>');

		TableAll.push('</table>');

		TableAll.push('<table class="foe-table all-mode">');
		TableAll.push( rowC.join('') );
		TableAll.push('</table>');

		Productions.SetTabContent('all', TableAll.join(''));


		// alles zusammen basteln
		h.push( Productions.GetTabs() );
		h.push( Productions.GetTabContent() );

		h.push('</div>');

		$('#Productions').find('#ProductionsBody').html( h.join('') );

		setTimeout(()=>{
			$('.tabs').tabslet();
			$('.sortable-table').tableSorter();
			Productions.SwitchFunction();
			Productions.SortingAllTab();
		}, 200)
	},


	/**
	 * Merkt sich alle Tabs
	 *
	 * @param id
	 * @constructor
	 */
	SetTabs: (id)=>{
		Productions.Tabs.push('<li class="' + id + ' game-cursor"><a href="#' + id + '" class="game-cursor">&nbsp;</a></li>');
	},


	/**
	 * Gibt alle gemerkten Tabs aus
	 *
	 * @returns {string}
	 * @constructor
	 */
	GetTabs: ()=> {
		return '<ul class="horizontal">' + Productions.Tabs.join('') + '</ul>';
	},


	/**
	 * Speichert BoxContent zwischen
	 *
	 * @param id
	 * @param content
	 * @constructor
	 */
	SetTabContent: (id, content)=>{
		Productions.TabsContent.push('<div id="' + id + '">' + content + '</div>');
	},


	/**
	 * Setzt alle gespeicherten Tabellen zusammen
	 *
	 * @returns {string}
	 * @constructor
	 */
	GetTabContent: ()=> {
		return Productions.TabsContent.join('');
	},


	/**
	 * Schalter für die Tabs [Einzelansicht|Gesamtansicht]
	 *
	 * @constructor
	 */
	SwitchFunction: ()=>{
		$('body').on('click', '.change-view', function(){
			let t = $(this).data('type');

			$('.' + t + '-mode').fadeToggle('fast');

			setTimeout(()=>{
				if( $('.' + t + '-single').is(':visible') )
				{
					$(this).text(i18n['Boxes']['Productions']['ModeGroups']);
				} else {
					$(this).text(i18n['Boxes']['Productions']['ModeSingle']);
				}
			}, 300);

		});
	},


	/**
	 * Sortiert alle Gebäude des letzten Tabs
	 *
	 * @constructor
	 */
	SortingAllTab: ()=>{

		// Gruppiert die Gebäude
		$('#all tr').each(function(){

			let regex = /([a-z_])*/i;
			let matches = regex.exec( $(this).attr('class') );

			if(matches.length && matches[0] !== "undefined")
			{
				if(!$('#parent-' + matches[0]).length)
				{
					$('<tbody id="parent-' + matches[0] + '" class="parent"><tr><th colspan="4">' + Productions.BuildingTypes[matches[0]] + '</th></tr></tbody>').appendTo('.all-mode');
				}

				/* add to parent */
				$(this).appendTo( $('#parent-' + matches[0]) );
			}
		});


		// Dropdown zum Filtern
		let drop = $('<select />').attr('id', 'all-drop').addClass('game-cursor');

		drop.append( $('<option />').attr('data-type', 'all').text( i18n['Boxes']['Productions']['Headings']['all'] ) )

		for(let i in Productions.Buildings)
		{
			if(Productions.Buildings.hasOwnProperty(i))
			{
				drop.append( $('<option />').attr('data-type', Productions.Buildings[i]).text( Productions.BuildingTypes[Productions.Buildings[i]] ).addClass('game-cursor') )
			}
		}

		$('#all-dropdown-th').append(drop);

		setTimeout(()=>{
			Productions.Dropdown();
		}, 100)
	},


	/**
	 * Blendet je nach Dropdown die Typen ein
	 * @constructor
	 */
	Dropdown: ()=>{
		$('body').on('change', '#all-drop', function() {
			let t = $('select#all-drop :selected').data('type');

			if(t === 'all')
			{
				$('.all-mode').find('.parent').show();
			}
			else {
				$('.all-mode').find('.parent').hide();
				$('.all-mode').find('#parent-' + t).show();
			}
		});
	},


	/**
	 * Kleine Suche für die "Gesamt"-Liste
	 *
	 * @constructor
	 */
	Filter: ()=>{
		let input, filter, tr, td, i, txtValue;

		input = $("#all-search").val();
		filter = input.toUpperCase();
		tr = $('#all').find('tr');

		// durch alle TRs rennen
		for (i = 0; i < tr.length; i++) {
			td = $(tr[i]).find('td')[0];

			if (td) {
				txtValue = $(td).text();

				if (txtValue.toUpperCase().indexOf(filter) > -1) {
					tr[i].style.display = "";
				} else {
					tr[i].style.display = "none";
				}
			}
		}
	},


	/**
	 * Hilfsfunktion zum Prüfen auf "leer"
	 *
	 * @param obj
	 * @returns {boolean}
	 */
	isEmpty: (obj)=> {
		for(let key in obj) {
			if(obj.hasOwnProperty(key))
				return false;
		}
		return true;
	}
};