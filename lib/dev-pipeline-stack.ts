import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { Construct } from 'constructs';

export class DevPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sourceOutput = new codepipeline.Artifact();

    const buildProject = new codebuild.PipelineProject(this, 'Web3DevBuildProject', {
      buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec.yml'),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        environmentVariables: {
          BUCKET_NAME: {
            value: 'web3-dev-app-540257590858-us-west-2'
          }
        }
      }
    });

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
  }
}