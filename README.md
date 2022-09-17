# cdk-rest-api
 
A minimal repository that consistently re-produces Too many requests error upon API Gateway creation via CDK

#### In order to deploy this repository, please do the following:

- In the cli run: `yarn`.
- Add an AWS account credentials to a .env file.
- optionally modify the number of nested stacks to be deployed and the number of endpoints should be created in them. 
- finally, run `yarn cdk deploy --all` 