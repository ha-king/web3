#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Web3ProdStack } from '../lib/web3-prod-stack';
import { Web3DevStack } from '../lib/web3-dev-stack';

const app = new cdk.App();

// Combined stacks with app and pipeline
new Web3ProdStack(app, 'Web3ProdStack', {});
new Web3DevStack(app, 'Web3DevStack', {});