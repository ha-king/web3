import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { Construct } from 'constructs';

export class Web3ProdStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, 'Web3ProdAppBucket', {
      bucketName: `web3-prod-app-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    const distribution = new cloudfront.Distribution(this, 'Web3ProdDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      },
      defaultRootObject: 'index.html'
    });

    new s3deploy.BucketDeployment(this, 'DeployWeb3ProdApp', {
      sources: [s3deploy.Source.asset('.', {
        exclude: ['*.ts', 'node_modules', 'cdk.out', 'lib', 'bin', 'test', '*.json', '!app.js']
      })],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ['/*'],
      cacheControl: [s3deploy.CacheControl.noCache()]
    });

    const sourceOutput = new codepipeline.Artifact();

    const buildProject = new codebuild.PipelineProject(this, 'Web3BuildProject', {
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          build: {
            commands: [
              `aws s3 sync . s3://${bucket.bucketName} --exclude "*" --include "*.html" --include "*.css" --include "app.js"`,
              `DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?contains(Origins.Items[0].DomainName, '${bucket.bucketName}')].Id" --output text)`,
              'aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*" || true'
            ]
          }
        }
      }),
      environment: { buildImage: codebuild.LinuxBuildImage.STANDARD_7_0 }
    });

    buildProject.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: ['s3:*'],
      resources: [`arn:aws:s3:::${bucket.bucketName}`, `arn:aws:s3:::${bucket.bucketName}/*`]
    }));
    
    buildProject.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: ['cloudfront:CreateInvalidation', 'cloudfront:ListDistributions'],
      resources: ['*']
    }));

    new codepipeline.Pipeline(this, 'Web3Pipeline', {
      pipelineName: 'Web3-Prod-Pipeline',
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.GitHubSourceAction({
              actionName: 'GitHub_Source',
              owner: 'ha-king',
              repo: 'web3',
              branch: 'prod',
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

    new cdk.CfnOutput(this, 'ProdWebsiteURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'Web3 Prod App URL'
    });
  }
}