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

    // S3 and CloudFront for app hosting
    const bucket = new s3.Bucket(this, 'Web3ProdAppBucket', {
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

    // CI/CD Pipeline
    const sourceOutput = new codepipeline.Artifact();

    const buildProject = new codebuild.PipelineProject(this, 'Web3ProdBuildProject', {
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': { nodejs: '18' },
            commands: ['npm install -g aws-cdk', 'npm install']
          },
          build: {
            commands: ['npm run build', 'npx cdk deploy Web3ProdStack --require-approval never']
          }
        }
      }),
      environment: { buildImage: codebuild.LinuxBuildImage.STANDARD_7_0 }
    });

    buildProject.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: ['ssm:GetParameter'],
      resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/cdk-bootstrap/*`]
    }));

    new codepipeline.Pipeline(this, 'Web3ProdPipeline', {
      pipelineName: 'Web3-Prod-Pipeline',
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.GitHubSourceAction({
              actionName: 'GitHub_Source',
              owner: 'ha-king',
              repo: 'web3',
              branch: 'main',
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