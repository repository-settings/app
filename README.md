# GitHub Settings

This is a fork of [Probot Settings](https://github.com/probot/settings) configured for [serverless](https://github.com/probot/serverless-lambda) execution in AWS Lambda. 

To use:
1. Clone this repo
2. Run `npm install` inside the repo directory
3. Zip up the repo contents
4. Upload the zip to Lambda and set the handler to `handler.probot`
5. Set up lambda environment variables, including GHE_HOST if you are intending to use this with a private Github Enterprise installation. Note that your GHE host will need to be accessible to the lambda function in order for this application to work.
6. Configure an API Gateway with proxy enabled. The API gateway URL will be the webhook URL for your application. Optionally for convenience you can set up a custom domain name for the gateway. 