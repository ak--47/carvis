

![Carvis](https://aktunes.neocities.org/carvisLogo.png)

**a maker of CSV files** 

Carvis can make massive amounts of realistic, fake data as CSV files. These files map effortlessly to Mixpanel events, or user profiles.

The primarily motivation for this utility is to feed reverse-ETLs (like [Census](https://www.getcensus.com/) or [Hightouch](https://hightouch.io/)) which demonstrate how tabular data can be mapped to event (or people) data. 🥳

# install

  - clone the repo
```git clone https://github.com/ak--47/carvis.git```

  - change your current working directory to `/carvis` :
```cd ~/carvis```
  
- install dependencies:
```npm install```

- use Carvis to make data! see [usage](#usage) for use-cases
  
# usage
  - generate some fake data with default params
  `npm run carvis` 
  
  - see CSV file written to `./data/`
  `data written to ./data/carvisData-events-{datetime}.csv`
  
![example data with default params](https://aktunes.neocities.org/carvis.png)

- if you're on OSX, Carvis should pop open the `./data/` directory in Finder.

# customizing the data
Carvis lets you control the data that gets built in the CSV file. The general usage is:

```
npm run carvis -- --{{option}} {{value}}
```
here are the available options; all are optional and can be used in *any* order:

| option | Alias | Purpose |
| ------ | ------ | ------ |
| `--cols` |`-c` | define the columns **AND** values for your CSV file. the format is `columnName:value1,value2,value3` ... you can use this to create multiple columns |
| `--rows` | `-r` | the number of rows/records to generate (default: `1000`) |
| `--days` | `-d` | the number of days (since today) to consider (default: `30`) |
| `--seed` | `-s` | any alphanumeric phrase which controls how `guid` is generated; use the same seed to get the same users across multiple files
|`--people`| `-p`| generate people profiles (including `$name`, `$email`, `$avatar`, etc...)

see [examples](#examples) for some recipes

# examples

 - generate 10,000  rows of event data
```
npm run carvis -- --rows 10000
```
 - generate 10,000 rows of event data over the last 90 days
```
npm run carvis -- --rows 10000 --days 90
```
- generate event data with column `eventName` with values `appOpen`, `appInstall`, or `pageView`  **and** column `userType` with values `free`, `trial`, or `paid`:
```
npm run carvis -- --cols eventName:appOpen,appInstall,pageView userType:free,trial,paid
```
- generate **people data** with column `npsScore` with values `1-10` but mostly `6`'s:
```
npm run carvis -- --people --cols npsScore:1,2,3,4,5,6,6,6,7,8,9,10
```
- generate **TWO** CSV files; one with **event data** where `eventName` has values `appOpen`, `appInstall`, or `pageView`  and one with **people data** where  column `Satisfaction Score` has values `1-5`.  `guid` should match across both files (note the `seed` used for both is the same)
```
npm run carvis -- --cols eventName:appOpen,appInstall,pageView --seed "are you satisfied?"
```
```
npm run carvis -- --people --cols "Satisfaction Score":1,2,3,4,5 --seed "are you satisfied?"
```

# why?
because sometimes you need [real fake data](https://www.youtube.com/watch?v=4270c5qWPBg). 
