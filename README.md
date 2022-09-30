
![Carvis](https://aktunes.neocities.org/carvisLogo.png)

**a maker of CSV files** 

Carvis is a command-line-tool that can make massive amounts of realistic, fake data as CSV files. These files map effortlessly to Mixpanel events, or user profiles.

The primarily motivation for this utility is to feed reverse-ETLs (like [Census](https://www.getcensus.com/) or [Hightouch](https://hightouch.io/)) which demonstrate how tabular data can be mapped to event (or people) data. 🥳 

Carvis can also make dimension tables for use in Mixpanel.

# usage 

you don't need to install `carvis` to use it. assuming you have [`node.js`](https://nodejs.org/en/download/) installed (v14 or greater) you can simply run:

```
npx carvis
```

and watch `carvis` generate some test data.
 
you can specify custom data with [options](#API):

```
npx carvis --[option] [value]
```
for example, if we wanted 50 rows of data, we can run
```
npx carvis --rows 50
```
To see a list of examples, run:
```
npx carvis --help
```
see [examples](#examples) and [API](#API) for more info

# examples

- generate some fake data as a CSV file
```
npx carvis
```

- generate some fake data as a JSON file
```
npx carvis --json
```
- generate some fake data in the mixpanel format
```
npx carvis --mixpanel
```

- generate 10,000 rows of event data
```
npx carvis --rows 10000
```

- generate 10,000 rows of event data over the last 90 days
```
npx carvis --rows 10000 --days 90
```

- generate event data with column `eventName` with values `appOpen`, `appInstall`, or `pageView`  **and** column `userType` with values `free`, `trial`, or `paid`:
``` 
npx carvis --cols eventName:appOpen,appInstall,pageView userType:free,trial,paid
```

- generate **people data** with column `npsScore` with values `1-10` but mostly `6`'s:
```
npx carvis --people --cols npsScore:1,2,3,4,5,6,6,6,7,8,9,10
```

- generate **TWO** CSV files with the *same users*; one with **event data** where `eventName` has values `appOpen`, `appInstall`, or `pageView` and one with **people data** where column `Satisfaction Score` has values `1-5`.

`guid` values will match across both files (note the `seed` used for both is the same)
```
npx carvis --cols eventName:appOpen,appInstall,pageView --seed "are you satisfied?"
```
```
npx carvis --people --cols "Satisfaction Score":1,2,3,4,5 --seed "are you satisfied?"
```
- generate a **dimension table** with 500 rows with a column `hashtag` with values `foo`, `bar`, and `baz`:
```
npx carvis --rows 500 --dimTable --cols hashTag:foo,bar,baz
```

# API

Carvis lets you control the data that gets built in the CSV file. The general usage is:

```
npm run carvis --{{option}} {{value}}
```
  

here are the available options; all are optional and can be used in *any* order:

| option | Alias | Purpose |
| ------ | ------ | ------ |  
| `--cols` |`-c` | define the columns **AND** values for your CSV file. the format is `columnName:value1,value2,value3` ... you can use this to create multiple columns |
| `--rows` | `-r` | the number of rows/records to generate (default: `1000`) |
| `--days` | `-d` | the number of days (since today) to consider (default: `5`) |
| `--seed` | `-s` | any alphanumeric phrase which controls how `distinct_id` is generated; use the same seed to get the same users across multiple files
|`--people`| `-p`| generate people profiles (including `$name`, `$email`, `$avatar`, etc...)|
|`--dimTable`| `-t`| generate a dimension table (with `unit_id` as an integer for the first column)|
|`--json`| `-j`| generate `NDJSON` format instead of CSV|
|`--mixpanel`| `-m`| generate mixpanel data in `NDJSON` format |
|`--silent`| `-s`| don't log stuff; pass filename to `stdout` |

note: the `dimTable` and `people` options are mutually exclusive. the `mixpanel` and `json` options are also mutually exclusive.

   

see [examples](#examples) for some recipes

  

# why?

  

because sometimes you need [real fake data](https://www.youtube.com/watch?v=4270c5qWPBg).