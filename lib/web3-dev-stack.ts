import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

export class Web3DevStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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

    new cdk.CfnOutput(this, 'DevWebsiteURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'Web3 Dev App URL'
    });
  }
}