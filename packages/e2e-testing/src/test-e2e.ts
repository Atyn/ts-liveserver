#!/usr/bin/env node

import Puppeteer from 'puppeteer'
import ChildProcess from 'child_process'
import Path from 'path'
import Fs from 'fs'

const SNAPSHOT_NAME = 'snapshots/snapshot.html'
const WAIT_TIME = 1000 // For Windows
main().catch((error) => {
	// eslint-disable-next-line no-console
	console.error(error)
	process.exit(1)
})

async function main() {
	const childProcess = ChildProcess.spawn('npm run test-environment:serve', {
		cwd: Path.resolve('..', 'test-environment'),
		detached: true,
		shell: true,
		stdio: 'pipe',
	})
	// eslint-disable-next-line no-console
	console.log('Wait', WAIT_TIME, 'ms...')
	await new Promise((resolve) => setTimeout(resolve, WAIT_TIME))
	// eslint-disable-next-line no-console
	console.log('Server is ready. Run Puppeteer!')
	try {
		await runPuppeteer()
	} catch (error) {
		childProcess.kill()
		throw error
	}
	childProcess.kill()
	process.exit(0)
}

async function runPuppeteer() {
	const browser = await Puppeteer.launch({
		headless: true,
		devtools: false,
		args: ['--no-sandbox', '--disable-setuid-sandbox'],
	})
	const page = await browser.newPage()
	// eslint-disable-next-line no-console
	page.on('console', (msg) => console.log('PAGE LOG:', msg.text()))
	await page.goto('http://localhost:8080', {
		waitUntil: ['domcontentloaded', 'networkidle0', 'networkidle2', 'load'],
	})
	const innerText = await page.evaluate(() => document.body.innerHTML)
	await Fs.promises.writeFile(SNAPSHOT_NAME, innerText)
	await browser.close()
}
