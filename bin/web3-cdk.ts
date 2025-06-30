#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Web3DevStack } from '../lib/web3-dev-stack';
import { Web3TestStack } from '../lib/web3-test-stack';
import { Web3ProdStack } from '../lib/web3-prod-stack';

const app = new cdk.App();

// Active stacks
new Web3DevStack(app, 'Web3DevStack', {});
new Web3TestStack(app, 'Web3TestStack', {});
new Web3ProdStack(app, 'Web3ProdStack', {});