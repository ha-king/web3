#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Web3ProdStack } from '../lib/web3-prod-stack';
import { Web3DevStack } from '../lib/web3-dev-stack';
import { Web3Dev2Stack } from '../lib/web3-dev2-stack';
import { Web3TestStack } from '../lib/web3-test-stack';
import { Web3Prod2Stack } from '../lib/web3-prod2-stack';

const app = new cdk.App();

// Combined stacks
new Web3ProdStack(app, 'Web3ProdStack', {});
new Web3DevStack(app, 'Web3DevStack', {});
new Web3Dev2Stack(app, 'Web3Dev2Stack', {});
new Web3TestStack(app, 'Web3TestStack', {});
new Web3Prod2Stack(app, 'Web3Prod2Stack', {});