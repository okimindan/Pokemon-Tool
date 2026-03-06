/**
 * Pokemon Tool CDK スタック定義
 *
 * 構成:
 *   - NodejsFunction: Lambda (esbuildで依存関係を自動バンドル)
 *   - API Gateway: REST API
 *   - S3 + CloudFront: フロントエンド静的ホスティング (将来用)
 *   - Workload Identity Federation でGCP認証 (JSONキー不要)
 */

import * as cdk from "aws-cdk-lib"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs"
import * as apigateway from "aws-cdk-lib/aws-apigateway"
import * as s3 from "aws-cdk-lib/aws-s3"
import * as cloudfront from "aws-cdk-lib/aws-cloudfront"
import * as origins from "aws-cdk-lib/aws-cloudfront-origins"
import * as iam from "aws-cdk-lib/aws-iam"
import * as logs from "aws-cdk-lib/aws-logs"
import * as ssm from "aws-cdk-lib/aws-ssm"
import { Construct } from "constructs"
import * as path from "path"

export class PokemonToolStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // ── Lambda 実行ロール ─────────────────────────────────────
    const lambdaRole = new iam.Role(this, "LambdaExecutionRole", {
      roleName: "pokemon-tool-lambda-role",
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      description: "Lambda role - trusted by GCP Workload Identity Pool (pokemon-tool-pool)",
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
      ],
    })

    // SSM Parameter Store: Sheets ID (既存パラメータを参照)
    const sheetsIdParam = ssm.StringParameter.fromStringParameterName(
      this, "GoogleSheetsId", "/pokemon-tool/google-sheets-id"
    )
    sheetsIdParam.grantRead(lambdaRole)

    // ── Lambda 共通設定 (NodejsFunction = esbuildで全依存関係をバンドル) ──
    const srcDir = path.join(__dirname, "../../src")
    const commonProps: Omit<lambdaNode.NodejsFunctionProps, "entry"> = {
      runtime: lambda.Runtime.NODEJS_20_X,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      bundling: {
        // esbuildで依存関係をインライン化 (node_modules不要)
        minify: false,
        sourceMap: true,
        // gcp-credentials.json をLambdaに同梱
        commandHooks: {
          beforeBundling: () => [],
          afterBundling: (_inputDir: string, outputDir: string) => [
            `cp -r ${path.join(__dirname, "../../config")} ${outputDir}/config`,
          ],
          beforeInstall: () => [],
        },
      },
      environment: {
        NODE_ENV: "production",
        GOOGLE_APPLICATION_CREDENTIALS: "/var/task/config/gcp-credentials.json",
        GOOGLE_SHEETS_ID_PARAM: "/pokemon-tool/google-sheets-id",
      },
      logGroup: new logs.LogGroup(this, "LambdaLogGroup", {
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    }

    // ── Lambda: ダメージ計算 ──────────────────────────────────
    const calcLambda = new lambdaNode.NodejsFunction(this, "CalcDamageFunction", {
      ...commonProps,
      functionName: "pokemon-tool-calc-damage",
      entry: path.join(srcDir, "lambda/calc-handler.ts"),
      description: "Pokemon SV damage calculation",
      logGroup: new logs.LogGroup(this, "CalcLogGroup", {
        logGroupName: "/aws/lambda/pokemon-tool-calc-damage",
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    })

    // ── Lambda: データ取得 ────────────────────────────────────
    const dataLambda = new lambdaNode.NodejsFunction(this, "DataFunction", {
      ...commonProps,
      functionName: "pokemon-tool-data",
      entry: path.join(srcDir, "lambda/data-handler.ts"),
      description: "Pokemon data from Google Sheets",
      logGroup: new logs.LogGroup(this, "DataLogGroup", {
        logGroupName: "/aws/lambda/pokemon-tool-data",
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    })

    // ── API Gateway ──────────────────────────────────────────
    const api = new apigateway.RestApi(this, "PokemonToolApi", {
      restApiName: "pokemon-tool-api",
      description: "Pokemon SV Tool API",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization"],
      },
      deployOptions: {
        stageName: "v1",
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
        metricsEnabled: true,
      },
    })

    const calcResource = api.root.addResource("calc")
    calcResource.addResource("damage").addMethod(
      "POST", new apigateway.LambdaIntegration(calcLambda)
    )

    const dataResource = api.root.addResource("data")
    const pokemonResource = dataResource.addResource("pokemon")
    pokemonResource.addMethod("GET", new apigateway.LambdaIntegration(dataLambda))
    pokemonResource.addResource("all").addMethod("GET", new apigateway.LambdaIntegration(dataLambda))
    const movesResource = dataResource.addResource("moves")
    movesResource.addMethod("GET", new apigateway.LambdaIntegration(dataLambda))
    movesResource.addResource("all").addMethod("GET", new apigateway.LambdaIntegration(dataLambda))

    // ── S3 + CloudFront: フロントエンド (将来用) ─────────────
    const frontendBucket = new s3.Bucket(this, "FrontendBucket", {
      bucketName: `pokemon-tool-frontend-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    })

    new cloudfront.CfnOriginAccessControl(this, "FrontendOAC", {
      originAccessControlConfig: {
        name: "pokemon-tool-oac",
        originAccessControlOriginType: "s3",
        signingBehavior: "always",
        signingProtocol: "sigv4",
      },
    })

    const distribution = new cloudfront.Distribution(this, "FrontendDistribution", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        "/api/*": {
          origin: new origins.HttpOrigin(
            `${api.restApiId}.execute-api.${this.region}.amazonaws.com`,
            { originPath: "/v1" }
          ),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        },
      },
      defaultRootObject: "index.html",
      errorResponses: [
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: "/index.html" },
      ],
    })

    // ── Outputs ───────────────────────────────────────────────
    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
      description: "API Gateway URL",
      exportName: "PokemonToolApiUrl",
    })
    new cdk.CfnOutput(this, "FrontendUrl", {
      value: `https://${distribution.distributionDomainName}`,
      description: "CloudFront URL",
      exportName: "PokemonToolFrontendUrl",
    })
    new cdk.CfnOutput(this, "FrontendBucketName", {
      value: frontendBucket.bucketName,
      description: "S3 Bucket for frontend",
      exportName: "PokemonToolFrontendBucket",
    })
    new cdk.CfnOutput(this, "LambdaRoleArn", {
      value: lambdaRole.roleArn,
      description: "Lambda IAM Role ARN (GCP Workload Identity用)",
      exportName: "PokemonToolLambdaRoleArn",
    })
  }
}
