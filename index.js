const commandLineArgs = require('command-line-args');
const Chance = require('chance');
const fs = require('fs');
const dayjs = require('dayjs');
const homeDir = require('os').homedir();
const desktopDir = `${homeDir}/Desktop`;

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

const optionDefinitions = [
    // { name: 'verbose', alias: 'v', type: Boolean },
    {
        name: 'cols',
        alias: 'c',
        type: String,
        multiple: true,
        defaultOption: true
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
    }

];

const options = commandLineArgs(optionDefinitions);
const {
    seed = "foo",
        rows = 1000,
        cols = ["action:chooseColor,changeColor,removeColor,addColor", "favoriteColor:red,orange,yellow,green,blue,indigo,violet"],
        days = 30
} = options;

const secondsInDay = 86400;
const secondsInHour = 3600;
const now = Math.round(new Date().getTime() / 1000);
const earliestTime = now - (secondsInDay * days);
let numUsers = 0;

const chance = new Chance(seed);
const columns = [];

cols.forEach((col) => {
    let split = col.split(':');
    columns.push({
        header: split[0],
        values: split[1].split(',')
    });
});


//distinct_id generation
chance.mixin({
    'user': function() {
    	numUsers++;
        return `${chance.guid()}`;
    }
});

//prepare columns
let csvFile = `insert_id,guid,time,`;
let allCols = columns.map(col => col.header).join();
csvFile += allCols + `\n`;

for (let i = 0; i < rows*2; i++) {
    let user = chance.user();
    
    //loop randomly for each user
    while (chance.bool({
            likelihood: chance.normal({
                mean: 50,
                dev: 10
            })
        })) {
        csvFile += `${chance.hash()},${user},${getTime(earliestTime, now)},${chooseRowValues(columns)}\n`;
        i++;
    }



}

function getTime(earliest = earliestTime, latest = now) {
    let midPoint = Math.round((earliest + latest) / 2);
    let lowBoundary = Math.round(chance.normal({
            mean: midPoint,
            dev: secondsInDay * days / 10
        }));
    //let highBoundary = chance.normal({mean: Math.round((midPoint+latest)/2), dev: secondsInDay*days/6)
    
    //ensure lowBoundry is not greater than now
    if (lowBoundary >= now) {
        lowBoundary = now - (secondsInDay * chance.integer({
            min: 1,
            max: 7
        }));
    }
    
    let chosenDate;
    
    //use normal distrib 50% of the time
    if (chance.bool()) {
        chosenDate = chance.integer({
            "min": lowBoundary,
            "max": now
        });
    } else {
        chosenDate = chance.integer({
            "min": earliestTime,
            "max": now
        });
    }
    //10% of the time, make events today
    if (chance.bool({likelihood: 10})) {
    	chosenDate = chance.integer({
    		"min": now - (secondsInHour*chance.integer({min: 1, max: 12})),
    		"max": now
    	});
    }
    return dayjs.unix(chosenDate).format("YYYY-MM-DD hh:mm:ss");
}

//pick data from each col for each row
function chooseRowValues(colDfn) {
    return colDfn.map(possibleValues => chance.pickone(possibleValues.values)).join(',');
}

//write the data
fs.writeFileSync(`${desktopDir}/carvisData-${now}.csv`, csvFile, function(err) {
    if (err) {
        return console.log(err);
    }
});

console.log(banner);
console.log('\n\n...maker of CSV files');
console.log('by AK');
console.log('ak@mixpanel.com');
console.log('\n');
console.log(`generating ${rows} records across ~${Math.round(numUsers/2)} users for ${days} days with columns:`);
console.log(`    ${columns.map(col => col.header).join('    \n    ')}`);
console.log('\n');
console.log(`data written to ${desktopDir}/carvisData-${now}.csv`);
console.log('\n');
console.log('all finished!');