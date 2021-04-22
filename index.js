const commandLineArgs = require('command-line-args');
const Chance = require('chance');
const fs = require('fs');
const dayjs = require('dayjs');
const readline = require('readline');
const { spawn } = require('child_process');

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

const optionDefinitions = [
    // { name: 'verbose', alias: 'v', type: Boolean },
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
    }

];

const options = commandLineArgs(optionDefinitions);
const {
    seed = "i am carvis",
        rows = 1000,
        cols = ["action:chooseColor,changeColor,removeColor,addColor", "favoriteColor:red,orange,yellow,green,blue,indigo,violet"],
        days = 30,
        people = false
} = options;

const secondsInDay = 86400;
const secondsInHour = 3600;
const now = Math.round(new Date().getTime() / 1000);
const earliestTime = now - (secondsInDay * days);
let numUsers = 0;

const chance = new Chance(seed);
const trueRandom = new Chance();
const columns = [];

cols.forEach((col) => {
    let split = col.split(':');
    let prop = {
        header: split[0],
        values: split[1].split(',')
    }

    let dupeLikelihood = trueRandom.bool({
        likelihood: trueRandom.integer({
            min: 50,
            max: 80
        })
    });

    //duplicate some prop values
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


//prepare columns
let csvFile = `insert_id,guid,`;

if (people) {
    csvFile += `$name,$email,$phone,$avatar,$created,$latitude,$longitude,`
}

else {
	csvFile += `time,`	
}


let allCols = columns.map(col => col.header).join();
csvFile += allCols + `\n`;

let i = 0;
while (i < rows) {
    let user = chance.guid();
    numUsers++


    //loop randomly for each user
    let loopLikelihood;

    do {    	
        i++;
        showProgress(i)
        if (people) {
            const gender = chance.pickone(['male', 'female']);
            const name = `${chance.first({gender: gender})} ${chance.last()}`;
            const avatarPrefix = `https://randomuser.me/api/portraits`;
            const randomAvatarNumber = chance.integer({
                min: 1,
                max: 99
            });
            const avatar = gender === 'male' ? `/men/${randomAvatarNumber}.jpg` : `/women/${randomAvatarNumber}.jpg`;
            const avatarURL = avatarPrefix + avatar;
            const coords = trueRandom.coordinates({
                fixed: 2
            }).split(',').map(coord => Number(coord.trim()))
            const latitude = coords[0]
            const longitude = coords[1]


            csvFile += `${trueRandom.hash()},${user},${name},${chance.email()},${'+'+chance.phone({formatted: false, country: "us"})},${avatarURL},${dayjs.unix(trueRandom.integer({min: earliestTime, max: now})).format("YYYY-MM-DD hh:mm:ss")},${latitude},${longitude},${chooseRowValues(columns)}\n`;

        } else {
            csvFile += `${trueRandom.hash()},${user},${getTime(earliestTime, now)},${chooseRowValues(columns)}\n`;
        }


        if (!people) {
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

        //don't loop for people
        else {
            loopLikelihood = false;
        }


    } while (loopLikelihood)


}

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
            "min": now - (secondsInHour * chance.integer({
                min: 1,
                max: 12
            })),
            "max": now
        });
    }

    return dayjs.unix(chosenDate).format("YYYY-MM-DD hh:mm:ss");
}

//pick data from each col for each row
function chooseRowValues(colDfn) {
    return colDfn.map(possibleValues => trueRandom.pickone(possibleValues.values)).join(',');
}

function noMoreThan(num) {
    if (num >= 99) {
        return 95;
    } else {
        return num;
    }
}

function showProgress(p) {
    //readline.clearLine(process.stdout);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(`generated ${p} records...`);
}


const fileName = `carvisData-${people ? 'users' : 'events'}-${now}.csv`

//write the data
fs.writeFileSync(`./data/${fileName}`, csvFile.trim(), function(err) {
    if (err) {
        return console.log(err);
    }
});



console.log(`\n\nfinished writing ${rows} records across ${numUsers} users for ${days} days with columns:`);
console.log(`    ${columns.map(col => col.header).join('    \n    ')}`);
console.log('\n');
console.log(`data written to ./data/${fileName}`);
console.log('\n');
console.log('all finished!');
console.log('\n');


function openExplorerinMac(path, callback) {
    path = path || '/';
    let p = spawn('open', [path]);
    p.on('error', (err) => {
        p.kill();
        return callback(err);
    });
}

try {
	openExplorerinMac('./data')
}

catch (e) {

}