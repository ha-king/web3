#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Web3ProdStack } from '../lib/web3-prod-stack';

const app = new cdk.App();

// Production stack only
new Web3ProdStack(app, 'Web3ProdStack', {});