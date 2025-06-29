import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { Construct } from 'constructs';

export class Web3DevStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 and CloudFront for app hosting
    const bucket = new s3.Bucket(this, 'Web3DevAppBucket', {
      bucketName: `web3-dev-app-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    const distribution = new cloudfront.Distribution(this, 'Web3DevDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      },
      defaultRootObject: 'index.html'
    });

    new s3deploy.BucketDeployment(this, 'DeployWeb3DevApp', {
      sources: [s3deploy.Source.asset('.', {
        exclude: ['*.ts', 'node_modules', 'cdk.out', 'lib', 'bin', 'test', '*.json', '!app.js']
      })],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ['/*'],
      cacheControl: [s3deploy.CacheControl.noCache()]
    });

    // CI/CD Pipeline
    const sourceOutput = new codepipeline.Artifact();

    const buildProject = new codebuild.PipelineProject(this, 'Web3DevBuildProject', {
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          build: {
            commands: ['aws s3 sync . s3://web3-dev-app-540257590858-us-west-2 --exclude "*" --include "*.html" --include "*.css" --include "app.js"', 'aws cloudfront create-invalidation --distribution-id dvwha8x1q83ra --paths "/*" || true']
          }
        }
      }),
      environment: { buildImage: codebuild.LinuxBuildImage.STANDARD_7_0 }
    });

    buildProject.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: ['ssm:GetParameter'],
      resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/cdk-bootstrap/*`]
    }));
    
    buildProject.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: ['s3:*'],
      resources: ['arn:aws:s3:::cdk-*', 'arn:aws:s3:::cdk-*/*']
    }));
    
    buildProject.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: ['cloudformation:*', 'iam:*'],
      resources: ['*']
    }));
    
    buildProject.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: ['sts:AssumeRole'],
      resources: [`arn:aws:iam::${this.account}:role/cdk-*`]
    }));
    
    buildProject.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: ['cloudfront:CreateInvalidation'],
      resources: ['*']
    }));

    new codepipeline.Pipeline(this, 'Web3DevPipeline', {
      pipelineName: 'Web3-Dev-Pipeline',
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.GitHubSourceAction({
              actionName: 'GitHub_Source',
              owner: 'ha-king',
              repo: 'web3',
              branch: 'dev',
              oauthToken: cdk.SecretValue.secretsManager('github-token'),
              output: sourceOutput
            })
          ]
        },
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Build',
              project: buildProject,
              input: sourceOutput
            })
          ]
        }
      ]
    });

    new cdk.CfnOutput(this, 'DevWebsiteURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'Web3 Dev App URL'
    });
  }
}