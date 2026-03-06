/**
 * Pokemon Tool CDK スタック定義
 *
 * 構成:
 *   - Lambda: ダメージ計算 (calc-handler)
 *   - Lambda: データ取得 (data-handler)
 *   - API Gateway: REST API
 *   - S3: フロントエンド静的ホスティング (将来用)
 *   - Workload Identity Federation でGCP認証 (JSONキー不要)
 */

import * as cdk from "aws-cdk-lib"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as apigateway from "aws-cdk-lib/aws-apigateway"
import * as s3 from "aws-cdk-lib/aws-s3"
import * as cloudfront from "aws-cdk-lib/aws-cloudfront"
import * as origins from "aws-cdk-lib/aws-cloudfront-origins"
import * as iam from "aws-cdk-lib/aws-iam"
import * as logs from "aws-cdk-lib/aws-logs"
import * as ssm from "aws-cdk-lib/aws-ssm"
import { Construct } from "constructs"
import * as path from "path"
import * as fs from "fs"

export class PokemonToolStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // ── Lambda 実行ロール (Workload Identity用) ───────────────
    // このロールのARNをGCPのWorkload Identity Poolに登録済み
    const lambdaRole = new iam.Role(this, "LambdaExecutionRole", {
      roleName: "pokemon-tool-lambda-role",
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      description: "Lambda role for Pokemon Tool - trusted by GCP Workload Identity Pool",
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
      ],
    })

    // Google Sheets IDはSSM Parameter Storeで管理 (無料・シークレット不要)
    const sheetsIdParam = new ssm.StringParameter(this, "GoogleSheetsId", {
      parameterName: "/pokemon-tool/google-sheets-id",
      stringValue: "YOUR_SPREADSHEET_ID_HERE", // デプロイ後にコンソールで更新
      description: "Google Sheets Spreadsheet ID for Pokemon data",
      tier: ssm.ParameterTier.STANDARD,
    })
    sheetsIdParam.grantRead(lambdaRole)

    // ── GCP認証設定ファイルの読み込み ────────────────────────
    // config/gcp-credentials.json は秘密情報なしのWorkload Identity設定
    const gcpCredentialsPath = path.join(__dirname, "../../config/gcp-credentials.json")
    const gcpCredentialsJson = fs.existsSync(gcpCredentialsPath)
      ? fs.readFileSync(gcpCredentialsPath, "utf-8")
      : "{}"

    // ── Lambda 共通設定 ──────────────────────────────────────
    const commonLambdaProps: Omit<lambda.FunctionProps, "handler"> = {
      runtime: lambda.Runtime.NODEJS_20_X,
      role: lambdaRole,
      // dist/ と config/ をまとめてバンドル
      code: lambda.Code.fromAsset(path.join(__dirname, "../.."), {
        exclude: [
          "node_modules",
          "src",
          "cdk",
          ".git",
          ".github",
          "*.md",
          "tsconfig.json",
          "package*.json",
        ],
        // distとconfigのみ含める
        bundling: {
          image: cdk.DockerImage.fromRegistry("public.ecr.aws/lambda/nodejs:20"),
          command: [
            "bash", "-c",
            [
              "cp -r /asset-input/dist /asset-output/",
              "cp -r /asset-input/config /asset-output/",
              "cp /asset-input/package.json /asset-output/",
              "cd /asset-output && npm install --production",
            ].join(" && "),
          ],
          local: {
            // ローカルビルドが可能な場合はDockerを使わない
            tryBundle(outputDir: string) {
              const distDir = path.join(__dirname, "../../dist")
              const configDir = path.join(__dirname, "../../config")
              if (!fs.existsSync(distDir)) return false
              fs.cpSync(distDir, path.join(outputDir, "dist"), { recursive: true })
              if (fs.existsSync(configDir)) {
                fs.cpSync(configDir, path.join(outputDir, "config"), { recursive: true })
              }
              return true
            },
          },
        },
      }),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        NODE_ENV: "production",
        // GCP認証設定 (秘密情報なし - Workload Identity設定のみ)
        GOOGLE_APPLICATION_CREDENTIALS: "/var/task/config/gcp-credentials.json",
        // Sheets ID はSSMから起動時に取得するため、パラメータ名を渡す
        GOOGLE_SHEETS_ID_PARAM: "/pokemon-tool/google-sheets-id",
      },
      logRetention: logs.RetentionDays.ONE_MONTH,
    }

    // ── Lambda: ダメージ計算 ──────────────────────────────────
    const calcLambda = new lambda.Function(this, "CalcDamageFunction", {
      ...commonLambdaProps,
      functionName: "pokemon-tool-calc-damage",
      handler: "dist/lambda/calc-handler.handler",
      description: "Pokemon SV damage calculation",
    })

    // ── Lambda: データ取得 ────────────────────────────────────
    const dataLambda = new lambda.Function(this, "DataFunction", {
      ...commonLambdaProps,
      functionName: "pokemon-tool-data",
      handler: "dist/lambda/data-handler.handler",
      description: "Pokemon data from Google Sheets",
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
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        metricsEnabled: true,
      },
    })

    // /calc/damage
    const calcResource = api.root.addResource("calc")
    calcResource.addResource("damage").addMethod(
      "POST",
      new apigateway.LambdaIntegration(calcLambda)
    )

    // /data/pokemon, /data/pokemon/all, /data/moves, /data/moves/all
    const dataResource = api.root.addResource("data")
    const pokemonResource = dataResource.addResource("pokemon")
    pokemonResource.addMethod("GET", new apigateway.LambdaIntegration(dataLambda))
    pokemonResource.addResource("all").addMethod("GET", new apigateway.LambdaIntegration(dataLambda))
    const movesResource = dataResource.addResource("moves")
    movesResource.addMethod("GET", new apigateway.LambdaIntegration(dataLambda))
    movesResource.addResource("all").addMethod("GET", new apigateway.LambdaIntegration(dataLambda))

    // ── S3: フロントエンド静的ホスティング (将来用) ────────────
    const frontendBucket = new s3.Bucket(this, "FrontendBucket", {
      bucketName: `pokemon-tool-frontend-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    })

    // CloudFront OAC
    const oac = new cloudfront.CfnOriginAccessControl(this, "FrontendOAC", {
      originAccessControlConfig: {
        name: "pokemon-tool-oac",
        originAccessControlOriginType: "s3",
        signingBehavior: "always",
        signingProtocol: "sigv4",
      },
    })

    const distribution = new cloudfront.Distribution(this, "FrontendDistribution", {
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket),
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

    frontendBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        principals: [new iam.ServicePrincipal("cloudfront.amazonaws.com")],
        resources: [frontendBucket.arnForObjects("*")],
        conditions: {
          StringEquals: {
            "AWS:SourceArn": `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`,
          },
        },
      })
    )

    // ── CloudFormation Outputs ────────────────────────────────
    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
      description: "API Gateway URL",
      exportName: "PokemonToolApiUrl",
    })

    new cdk.CfnOutput(this, "FrontendUrl", {
      value: `https://${distribution.distributionDomainName}`,
      description: "CloudFront URL (フロントエンド)",
      exportName: "PokemonToolFrontendUrl",
    })

    new cdk.CfnOutput(this, "FrontendBucketName", {
      value: frontendBucket.bucketName,
      description: "S3 Bucket for frontend",
      exportName: "PokemonToolFrontendBucket",
    })

    new cdk.CfnOutput(this, "LambdaRoleArn", {
      value: lambdaRole.roleArn,
      description: "Lambda IAM Role ARN (GCPのWorkload Identity Poolに登録するARN)",
      exportName: "PokemonToolLambdaRoleArn",
    })
  }
}
