# GitHub Settings

This is a fork of [Probot Settings](https://github.com/probot/settings) configured for [serverless](https://github.com/probot/serverless-lambda) execution in AWS Lambda. 

To use:
1. Clone this repo
2. Run `npm install` inside the repo directory
3. Zip up the repo contents
4. Upload the zip to Lambda and set the handler to `handler.probot`
5. Set up lambda environment variables
6. Configure an API Gateway with proxy enabled