#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Web3ProdStack } from '../lib/web3-cdk-stack';
import { Web3DevStack } from '../lib/web3-dev-stack';
import { PipelineStack } from '../lib/pipeline-stack';
import { DevPipelineStack } from '../lib/dev-pipeline-stack';

const app = new cdk.App();

// Production stacks
new Web3ProdStack(app, 'Web3ProdStack', {});
new PipelineStack(app, 'Web3PipelineStack', {});

// Development stacks
new Web3DevStack(app, 'Web3DevStack', {});
new DevPipelineStack(app, 'Web3DevPipelineStack', {});