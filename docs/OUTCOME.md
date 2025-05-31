As a part of this hackaton, we have evaluated the "close to real situation" working multiple engineers on the following tech stack:
- BE: Python, FastAPI, TurtoiseORM, Aerich, Pydantic, UV, Ruff, OpenAPI
- UI: NextJS, TypeScript, ReactQuery (Tanstack Query), TailwindCSS
- E2E: Playwright using TypeScript
- Local Infra: Docker Compose

For planning and ideasation:
- ChatGPT 4.1

For development we have used:
- Cursor Pro. Claude 4 Opus and Sonnet
- pre-commit hooks
- A set of default rules with some being adapted from GH Copilot

Cursor was set up in "auto apply" mode - full vibe-coding investment.


The flow was like that:
- 1 Dev uses LLM to generate API
- 2 Dev creates gerkin acceptance tests using requirements and initiates E2E tests for playwright
- 1 Dev completes API, updates OpenAPI spec
- 2 Dev takes OpenAPI spec, updates API Client for UI
- 2 Dev uses LLM to generate UI using: API Client (generated from OpenAPI), initial set of requriements, and E2E tests and pre-commit as a validaton


Insights:
- Dev 2 experienced a issues with Cursor running on his MacOS: hanging on opening the rules (empty screen), handing opening terminals (empty terminals)
- Dev 2 experienced a few issues giving Cursor control over docker - it crashed docker by attempting to run it a few hundreds of time at the same time
- Dev 2 found an issue with Playwright: it does not have a good feedback, hence Cursor got stuck too much, fixing one tests, breaking other tests and functionality
- Both devs exhausted all credits (500) in 6 hours (approx) and had to spend 50 USD more
- Both devs used Cursor to fix issues in "auto apply" mode
- Cursor broke the OpenAPI contracts here and there, even with the approach described above is applied
- The more code was written - the more actions it took for Cursor to write the code and decide on steps
- Cursor likes to write too many "one-off" scripts, unnecessary access to terminal
- Ineffiscient utilization of credits and context: making too many readme files, comments, too much repetition. Even in MAX mode it struggled to catch itself in a loop
- Cursor does not detect itself in the "loop" - does not ask user for the input

Take aways:
- Cursor looks alright to start a new project from a scratch
- Cursor looks alrihgt to create a PoC or maybe even MVP, assuming a reduced num of tech used, ideally having all in one containter/app (ideally - TS for UI with server actions for example)
- More tech involved - harder to make it all play nicely together, and OpenAPI spec does not guaranteee it
- E2E tests with browser (using Playwright) spend too much time, context, credits, and still breaking one thing while fixing other - it is due to lack of feedback loop - it cannot see the page. MCP would be nice there
- Indeed, not that much Typescript nor Python code was written manually - only some debugging
- Overall, it all was much faster than doing by hand

Wishes:
- Better preparation of boilerplate. Python is lacking proper cookie-cutter templates with the modern lib
- NextJS is so slow, it would be better off using Vite
- Playwright is a mistake - jest is better for LLM. Playwright MCP might change the situation, but I doubt it will do much
