
# Carvis
**a maker of CSV files** 
 by AK 
 ak@mixpanel.com
 
Carvis can make massive amounts of realistic, fake data as CSV files which map effortlessly to Mixpanel events, users, or groups. 

The primarily motivation for this utility is to feed reverse-ETLs (like [Census](https://www.getcensus.com/) or [Hightouch](https://hightouch.io/)) which demonstrate how tabular data can be mapped to event data.

# install

  - clone the repo
  `git clone https://github.com/ak--47/carvis.git` 

  - change your current working directory to `/carvis` to use it:
  `cd ~/carvis` 
  
# usage
  - generate some fake data with all the default params
  `npm run carvis` 
  
  - see CSV file on your desktop
  `data written to /Users/{you}/Desktop/carvisData-{date}.csv`
  
![example data](https://aktunes.neocities.org/carvis.png)

# customizing the data
Carvis lets you control the data that gets built in the CSV file. The general usage is:

```
npm run carvis -- --{{option}} value
```
here are the available options; all are optional

| option | Alias | Purpose |
| ------ | ------ | ------ |
| `cols` |`c` | define the columns AND values for your CSV file. the format is `columnName:value1,value2,value3` |
| `rows` | `r` | the number of rows to generate (default: `1000`) |
| `days` | `d` | the number of days (since today) to consider (defaul:t `30`) |
| `seed` | `s` | any alphanumeric phrase which controls how `guid` is generated; use the same seed to get the same users across multiple files

see [examples](#examples) for some recipes

# examples

 - generate 10,000  rows of data
```
npm run carvis -- --rows 10000
```
 - generate 10,000  rows of data over the last 90 days
```
npm run carvis -- --rows 10000 --days 90
```
- generate data with column `eventName` with values `appOpen`, `appInstall`, or `pageView`  **and** column `userType` with values `free`, `trial`, or `paid`:
```
npm run carvis -- --cols eventName:appOpen,appInstall,pageView userType:free,trial,paid
```
- generate TWO csv files with  column `eventName` with values `appOpen`, `appInstall`, or `pageView`  AND  column `Satisfaction Score` with values `1`, `2`, `3` , `4`, or `5` where the `guid` matches across both files (note the `seed` used for both is the same)
```
npm run carvis -- --cols eventName:appOpen,appInstall,pageView --seed "are you satisfied?"
```
```
npm run carvis -- --cols "Satisfaction Score":1,2,3,4,5 --seed "are you satisfied?"
```
