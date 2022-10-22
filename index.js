#! /usr/bin/env node
//dependencies
const commandLineArgs = require('command-line-args');
const Chance = require('chance');
const fs = require('fs');
const dayjs = require('dayjs');
const readline = require('readline');
const {
	spawn
} = require('child_process');
const path = require('path');
const Papa = require('papaparse');
const u = require('ak-tools');
const track = u.tracker('carvis');
const runId = u.uid(32);

const currentDirectory = path.resolve(process.cwd());


//cli arguments
const optionDefinitions = [

	{
		name: 'cols',
		alias: 'c',
		type: String,
		multiple: true
	}, {
		name: 'rows',
		alias: 'r',
		type: Number
	}, {
		name: 'seed',
		alias: 's',
		type: String,
		multiple: false
	}, {
		name: 'days',
		alias: 'd',
		type: String,
		multiple: false
	}, {
		name: 'people',
		alias: 'p',
		type: Boolean,
		multiple: false
	}, {
		name: 'dimTable',
		alias: 't',
		type: Boolean,
		multiple: false
	},
	{
		name: 'json',
		alises: 'j',
		type: Boolean,
		multiple: false
	}, {
		name: 'help',
		alias: 'h',
		type: Boolean,
		multiple: false
	},
	{
		name: 'mixpanel',
		aliases: 'mp',
		type: Boolean,
		multiple: false
	},
	{
		name: 'silent',
		alises: 's',
		type: Boolean,
		multiple: false
	}

];

const options = commandLineArgs(optionDefinitions);

//default options
const {
	seed = "i am carvis",
	rows = 1000,
	cols = ["event:page_view,link_click,button_click,log_in,watch_video,page_view,watch_video,page_view", "colorTheme:red,orange,yellow,green,blue,indigo,violet", "luckyNumber:2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,42,42,42,42,420"],
	days = 42,
	people = false,
	dimTable = false,
	help = false,
	json = false,
	mixpanel = false,
	silent = false,
} = options;

function log(data, silent = options.silent) {
	if (!silent) {
		console.log(data);
	}
}


//yay bannerz
const banner = `
    ,o888888o.           .8.          8 888888888o. '8.'888b           ,8'  8 8888    d888888o.   
   8888     '88.        .888.         8 8888    '88. '8.'888b         ,8'   8 8888  .'8888:' '88. 
,8 8888       '8.      :88888.        8 8888     '88  '8.'888b       ,8'    8 8888  8.'8888.   Y8 
88 8888               . '88888.       8 8888     ,88   '8.'888b     ,8'     8 8888  '8.'8888.     
88 8888              .8. '88888.      8 8888.   ,88'    '8.'888b   ,8'      8 8888   '8.'8888.    
88 8888             .8'8. '88888.     8 888888888P'      '8.'888b ,8'       8 8888    '8.'8888.   
88 8888            .8' '8. '88888.    8 8888'8b           '8.'888b8'        8 8888     '8.'8888.  
'8 8888       .8' .8'   '8. '88888.   8 8888 '8b.          '8.'888'         8 8888 8b   '8.'8888. 
   8888     ,88' .888888888. '88888.  8 8888   '8b.         '8.'8'          8 8888 '8b.  ;8.'8888 
    '8888888P'  .8'       '8. '88888. 8 8888     '88.        '8.'           8 8888  'Y8888P ,88P' 
`;
log(banner);
log('... maker of CSV files... and more!');
log('by AK');
log('ak@mixpanel.com');
log('\n');
track('start', {runId, ...options})


if (help) {
	console.log(`\tAPI:\n`);
	console.table({
		rows: {
			option: `--rows`,
			alias: `-r`,
			purpose: `number of events/people in the data`,
		},
		days: {
			option: `--days`,
			alias: `-d`,
			purpose: `number of days (since today) to model`,
		},
		seed: {
			option: `--seed`,
			alias: `-s`,
			purpose: `alphanumeric phrase for pseudo-randomness`,
		},
		json: {
			option: `--json`,
			alias: `-j`,
			purpose: `output valid JSON instead of CSV`,
		},
		mixpanel: {
			option: `--mixpanel`,
			alias: `-m`,
			purpose: `make mixpanel data in NDJSON format`,
		},
		silent: {
			option: `--silent`,
			alias: `-s`,
			purpose: `don't log stuff; pass filename to stdout`,
		},
		people: {
			option: `--people`,
			alias: `-p`,
			purpose: `generate user profiles`,
		},
		dimTable: {
			option: `--dimTable`,
			alias: `-t`,
			purpose: `generate a dimension table, incrementing on first column`,
		},
		columns: {
			option: `--cols`,
			alias: `-c`,
			purpose: `define the col & value pairs; the format is "columnName:value1,value2,value3"`,
		}
	});
	console.log(`
    EXAMPLES:
    
    carvis --rows 10000
    carvis --rows 10000 --mixpanel
    carvis --rows 10000 --days 90
    carvis --rows 10000 --days 90 --json
    carvis --cols event:foo,bar userType:baz,qux    
    carvis --cols event:foo,bar --seed "are you satisfied?"
    carvis --people --cols npsScore:1,2,3
    carvis --rows 500 --dimTable --cols hashTag:foo,bar,baz

    docs: https://github.com/ak--47/carvis
    
    `);
	return true;
}

//can't do dimension table + people
if (dimTable && people) {
	console.error('\nsorry, i cannot make a dimension table AND a user table at the same time\n');
	throw new Error('\nERROR: cannont use --people and --dimTable options together (they are mutually exclusive)\n');
}

if (json && mixpanel) {
	console.error(`\nsorry, i can't do "--json" and "--mixpanel" at the same time... just use "--mixpanel" if you are trying to load data into mixpanel\n`);
	throw new Error('\nERROR: cannont use --json and --mixpanel options together (they are mutually exclusive)\n');
}

//determine file type
let fileType;
let events;
if (people) {
	fileType = `people`; events = false;
}
else if (dimTable) {
	fileType = `dimTable`;
	if (!people) events = true;
}
else {
	fileType = `events`;
	events = true;
}



//time stuff
const secondsInDay = 86400;
const secondsInHour = 3600;
const now = Math.round(new Date().getTime() / 1000);
const earliestTime = now - (secondsInDay * days);

//the file we will eventually write to
const fileName = `carvisData-${fileType}-${now}.${json || mixpanel ? 'ndjson' : 'csv'}`;

//three instances of chance
const guidChance = new Chance(seed);
const userChance = new Chance(seed);
const trueRandom = new Chance(); //this one is TRULY random


//store columns here
const columns = [];

//create objects of each column
cols.forEach((col) => {
	let split = col.split(':');
	let prop = {
		header: split[0],
		values: split[1].split(',')
	};

	let dupeLikelihood = trueRandom.bool({
		likelihood: trueRandom.integer({
			min: 50,
			max: 80
		})
	});

	//duplicate some prop values to get variation in the data
	while (dupeLikelihood) {
		let dupeValue = trueRandom.pickone(prop.values);
		prop.values.push(dupeValue);
		dupeLikelihood = trueRandom.bool({
			likelihood: trueRandom.integer({
				min: 50,
				max: 80
			})
		});
	}

	columns.push(prop);
});

let csvFile = ``;

if (dimTable) {
	//dimension tables just get unit_id
	csvFile += `unit_id,`;
} else {

	//events get these headers
	if (events) csvFile += `$insert_id,distinct_id,time,`;

	//people files get these headers
	if (people) {
		csvFile += `$distinct_id,$name,$email,$phone,$avatar,$created,$latitude,$longitude,`;

	}

}

//prepare and append custom headers
let allCols = columns.map(col => col.header).join();
csvFile += allCols + `\n`;


let numRecordsMade = 0;
let numUsers = 0;

//the main loop that creates users
while (numRecordsMade < rows) {
	let user = guidChance.guid();
	numUsers++;

	//this will be true or false after the first loop to determine if the user gets multiple records
	let loopLikelihood;

	//always make one record for a user
	do {
		numRecordsMade++;
		if (!silent) showProgress(numRecordsMade);

		//for people profiles, figure out all this stuff
		if (people) {
			const gender = userChance.pickone(['male', 'female']);
			const name = `${userChance.first({ gender: gender })} ${userChance.last()}`;
			const avatarPrefix = `https://randomuser.me/api/portraits`;
			const randomAvatarNumber = userChance.integer({
				min: 1,
				max: 99
			});
			const avatar = gender === 'male' ? `/men/${randomAvatarNumber}.jpg` : `/women/${randomAvatarNumber}.jpg`;
			const avatarURL = avatarPrefix + avatar;
			const coords = trueRandom.coordinates({
				fixed: 2
			}).split(',').map(coord => Number(coord.trim()));
			const latitude = coords[0];
			const longitude = coords[1];

			//append the people record to the CSV file
			csvFile += `${user},${name},${userChance.email()},${'+' + userChance.phone({ formatted: false, country: "us" })},${avatarURL},${dayjs.unix(trueRandom.integer({ min: earliestTime, max: now })).format("YYYY-MM-DD hh:mm:ss")},${latitude},${longitude},${chooseRowValues(columns)}\n`;

		}

		//for dimension tables, just add the supplied cols
		else if (dimTable) {
			csvFile += `${numRecordsMade},${chooseRowValues(columns)}\n`;
		} else {
			//for events add a few more thing
			csvFile += `${trueRandom.hash()},${user},${getTime(earliestTime, now)},${chooseRowValues(columns)}\n`;
		}

		//for events, determine if the user will do another event
		if (!people && !dimTable) {
			try {
				loopLikelihood = trueRandom.bool({
					likelihood: noMoreThan(Math.round(trueRandom.normal({
						mean: trueRandom.integer({
							min: 40,
							max: 70
						}),
						dev: trueRandom.integer({
							min: 5,
							max: 15
						})
					})))
				});
			} catch (e) {
				loopLikelihood = trueRandom.bool();
			}

		}

		//never loop for people; only 1 record per person or dimTable
		else {
			loopLikelihood = false;
		}


	} while (loopLikelihood);


}

//helper to get realstically weighted time
function getTime(earliest = earliestTime, latest = now) {
	let midPoint = Math.round((earliest + latest) / 2);
	let lowBoundary = Math.round(trueRandom.normal({
		mean: midPoint,
		dev: secondsInDay * days / 10
	}));

	//ensure lowBoundry is not greater than now
	if (lowBoundary >= now) {
		lowBoundary = now - (secondsInDay * trueRandom.integer({
			min: 1,
			max: 7
		}));
	}

	let chosenDate;

	//use normal distrib 50% of the time
	if (trueRandom.bool()) {
		chosenDate = trueRandom.integer({
			"min": lowBoundary,
			"max": now
		});
	} else {
		chosenDate = trueRandom.integer({
			"min": earliestTime,
			"max": now
		});
	}
	//10% of the time, make events today
	if (trueRandom.bool({
		likelihood: 5
	})) {
		chosenDate = trueRandom.integer({
			"min": now - (secondsInHour * trueRandom.integer({
				min: 1,
				max: 12
			})),
			"max": now
		});
	}

	if (mixpanel) return chosenDate;
	return dayjs.unix(chosenDate).format("YYYY-MM-DD hh:mm:ss");
}

//helper to pick data from each col for each row
function chooseRowValues(colDfn) {
	return colDfn.map(possibleValues => trueRandom.pickone(possibleValues.values)).join(',');
}

//helper to make sure we never have likelihood > 100
function noMoreThan(num) {
	if (num >= 99) {
		return 95;
	} else {
		return num;
	}
}

//helper for status bar
function showProgress(p) {
	readline.cursorTo(process.stdout, 0);
	process.stdout.write(`generated ${p - 1} records...`);
}

//helper to open the finder
function openExplorerinMac(path, callback) {
	path = path || '/';
	let p = spawn('open', [path]);
	p.on('error', (err) => {
		p.kill();
		return callback(err);
	});
}

let dataToWrite;
if (json) {
	const config = {
		header: true
	};
	dataToWrite = Papa.parse(csvFile.trim(), config).data.map(JSON.stringify).join('\n');
}

else if (mixpanel) {
	const jsonData = Papa.parse(csvFile.trim(), { header: true }).data;
	const transformedData = jsonData.map((ev) => {
		let mpEvent = {
			"event": ev?.event || "missing event name",
			"properties": {
				...ev,
				time: Number(ev.time)
			}
		};
		delete mpEvent.properties.event;
		return mpEvent;
	});
	dataToWrite = transformedData.map(JSON.stringify).join('\n');
}

else {
	dataToWrite = csvFile.trim();
}

//cool ... write the data
fs.writeFileSync(path.resolve(`${currentDirectory}/${fileName}`), dataToWrite, function (err) {	
	if (err) {
		return console.log(err);
	}
});


//tell the user what happened
log(`\n\nfinished writing ${rows} records across ${numUsers} users for ${days} days with columns:`);
log(`    ${columns.map(col => col.header).join('    \n    ')}`);
log('\n');
log(`data written to ./data/${fileName}`);
log('\n');
log('all finished!');
log('\n');
if (silent) {
	const outputMsg = path.resolve(`${currentDirectory}/${fileName}`) + '\n';
	process.stdout.write(outputMsg);
	//process.exit(0);
}


if (!silent) {
	//attempt to reveal the data folder in finder
	try {
		openExplorerinMac(currentDirectory);
	} catch (e) {
		console.error('revealing files only works on a mac; sorry!');
	}
}

track('end', {runId, ...options})
//process.exit(0);