//dependencies
const commandLineArgs = require('command-line-args');
const Chance = require('chance');
const fs = require('fs');
const dayjs = require('dayjs');
const readline = require('readline');
const {
    spawn
} = require('child_process');

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
console.log(banner);
console.log('... maker of CSV files');
console.log('by AK');
console.log('ak@mixpanel.com');
console.log('\n\n');

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
    }

];

const options = commandLineArgs(optionDefinitions);

//default options
const {
    seed = "i am carvis",
        rows = 1000,
        cols = ["action:chooseColor,changeColor,removeColor,addColor", "favoriteColor:red,orange,yellow,green,blue,indigo,violet"],
        days = 30,
        people = false,
        dimTable = false
} = options;

//can't do dimension table + people
if (dimTable && people) {
    console.error('\nsorry, i cannot make a dimension table AND a user table at the same time\n');
    throw new Error('\nERROR: cannont use --people and --dimTable options together (they are mutually exclusive)\n');
}

//determine file type
let fileType;
if (people) fileType = `people`;
else if (dimTable) fileType = `dimTable`;
else fileType = `events`;



//time stuff
const secondsInDay = 86400;
const secondsInHour = 3600;
const now = Math.round(new Date().getTime() / 1000);
const earliestTime = now - (secondsInDay * days);

//the file we will eventually write to
const fileName = `carvisData-${fileType}-${now}.csv`;

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

    //events + people get these headers
    csvFile += `insert_id,guid,`;

    //people files get these headers
    if (people) {
        csvFile += `$name,$email,$phone,$avatar,$created,$latitude,$longitude,`;

    }

    //event files get these headers
    else {
        csvFile += `time,`;
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
        showProgress(numRecordsMade);

        //for people profiles, figure out all this stuff
        if (people) {
            const gender = userChance.pickone(['male', 'female']);
            const name = `${userChance.first({gender: gender})} ${userChance.last()}`;
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
            csvFile += `${trueRandom.hash()},${user},${name},${userChance.email()},${'+'+userChance.phone({formatted: false, country: "us"})},${avatarURL},${dayjs.unix(trueRandom.integer({min: earliestTime, max: now})).format("YYYY-MM-DD hh:mm:ss")},${latitude},${longitude},${chooseRowValues(columns)}\n`;

        }

        //for dimension tables, just add the supplied cols
        else if (dimTable) {
            csvFile += `${numRecordsMade},${chooseRowValues(columns)}\n `;
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
    process.stdout.write(`generated ${p-1} records...`);
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


//cool ... write the data
fs.writeFileSync(`./data/${fileName}`, csvFile.trim(), function(err) {
    if (err) {
        return console.log(err);
    }
});


//tell the user what happened
console.log(`\n\nfinished writing ${rows} records across ${numUsers} users for ${days} days with columns:`);
console.log(`    ${columns.map(col => col.header).join('    \n    ')}`);
console.log('\n');
console.log(`data written to ./data/${fileName}`);
console.log('\n');
console.log('all finished!');
console.log('\n');



//attempt to reveal the data folder in finder
try {
    openExplorerinMac('./data')
} catch (e) {
    console.error('revealing files only works on a mac; sorry!')
}

