const commandLineArgs = require('command-line-args');
const Chance = require('chance');
fs = require('fs');


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
        rows = 10000,
        cols = ["action:chooseColor,changeColor,removeColor", "favoriteColor:red,orange,yellow,green,blue,indigo,violet"],
        days = 30
} = options;

const secondsInADay = 86400;
const now = Math.round(new Date().getTime() / 1000);
const earliest = now - (secondsInADay * days);

const chance = new Chance(seed);
const columns = [];

cols.forEach((col) => {
    let split = col.split(':');
    columns.push({
        header: split[0],
        values: split[1].split(',')
    })
})



chance.mixin({
    'user': function() {
        return `${chance.guid()}`;
    }
});

let csvFile = `guid,time,`;
let allCols = columns.map(col => col.header).join();
csvFile += allCols + `\n`

for (let i = 0; i < rows; i++) {
    let user = chance.user();
    while (chance.bool({
            likelihood: chance.normal({
                mean: 50
            })
        })) {
        csvFile += `${user},${chance.integer({"min": earliest, "max": now})},${chooseRowValues(columns)}\n`;
        i++;
    }

}


function chooseRowValues(colDfn) {
    return colDfn.map(possibleValues => chance.pickone(possibleValues.values)).join(',')
}

//write the data
fs.writeFileSync(`./data/data-${now}.csv`, csvFile, function(err) {
    if (err) {
        return console.log(err);
    } else {
        console.log(`data written to ./data/data-${now}.csv`);
    }

});

debugger;