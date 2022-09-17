#!/usr/bin/env node
import {App} from 'aws-cdk-lib';
import * as dotenv from 'dotenv';
import {RestStack} from "./stacks/rest.stack";

dotenv.config({path: '../.env'});

const app = new App();

new RestStack(app, 'rest', {
    env: {
        account: process.env.CDK_DEPLOY_ACCOUNT,
        region: process.env.CDK_DEPLOY_REGION,
    },
    nestedStacks: 4,
    nestedStacksSize: 30
})