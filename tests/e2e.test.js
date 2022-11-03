const recipies = [
	``,
	`--json`,
	`--mixpanel`,
	`--rows 1000`,
	`--rows 1000 --days 90`,
	`--cols eventName:appOpen,appInstall,pageView`,
	`--people --cols npsScore:1,2,3,4,5,6,6,6,7,8,9,10`,
	`--cols eventName:appOpen,appInstall,pageView`,
	`--people --cols "Satisfaction Score":1,2,3,4,5`,
	`--rows 500 --dimTable --cols hashTag:foo,bar,baz`
];

const fileExtensions = ['csv', 'ndjson']

const { execSync } = require("child_process");


const command = `node ./index.js`
const suffix = `--silent`

describe('do tests work?', () => {
	test('a = a', () => {
		expect(true).toBe(true);
	});
});

describe('do recipies work?', ()=>{
	test('all recipies', async()=>{
		for (const recipe of recipies) {
			const output =  execSync(`${command} ${recipe} ${suffix}`).toString().trim();
			const fileExtension = output.split('.')[1];
			expect(fileExtensions.includes(fileExtension)).toBe(true)
		}
	})

})


afterAll(async ()=>{
	execSync(`npm run prune`)
})