/**
 * Pokemon Tool CDK スタック定義
 *
 * 構成:
 *   - Lambda: ダメージ計算 (calc-handler)
 *   - Lambda: データ取得 (data-handler)
 *   - API Gateway: REST API
 *   - S3: フロントエンド静的ホスティング (将来用)
 *   - Secrets Manager: Google Sheets認証情報
 */

import * as cdk from "aws-cdk-lib"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as apigateway from "aws-cdk-lib/aws-apigateway"
import * as s3 from "aws-cdk-lib/aws-s3"
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment"
import * as cloudfront from "aws-cdk-lib/aws-cloudfront"
import * as origins from "aws-cdk-lib/aws-cloudfront-origins"
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager"
import * as iam from "aws-cdk-lib/aws-iam"
import * as logs from "aws-cdk-lib/aws-logs"
import { Construct } from "constructs"
import * as path from "path"

export class PokemonToolStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // ── Secrets Manager: Google Sheets認証情報 ────────────────
    const sheetsSecret = new secretsmanager.Secret(this, "GoogleSheetsSecret", {
      secretName: "pokemon-tool/google-sheets",
      description: "Google Sheets API credentials for Pokemon Tool",
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          GOOGLE_SERVICE_ACCOUNT_EMAIL: "your-service-account@project.iam.gserviceaccount.com",
          GOOGLE_SHEETS_ID: "your-spreadsheet-id",
        }),
        generateStringKey: "GOOGLE_PRIVATE_KEY",
      },
    })

    // ── Lambda 共通設定 ──────────────────────────────────────
    const commonLambdaProps: Omit<lambda.FunctionProps, "handler"> = {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(path.join(__dirname, "../../dist"), {
        // TypeScriptビルド後のdistディレクトリをバンドル
        bundling: {
          image: lambda.Runtime.NODEJS_20_X.bundlingImage,
          command: [
            "bash", "-c",
            [
              "npm install --prefix /asset-output",
              "cp -r /asset-input/* /asset-output/",
            ].join(" && "),
          ],
        },
      }),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        NODE_ENV: "production",
        GOOGLE_SHEETS_SECRET_ARN: sheetsSecret.secretArn,
      },
      logRetention: logs.RetentionDays.ONE_MONTH,
    }

    // ── Lambda: ダメージ計算 ──────────────────────────────────
    const calcLambda = new lambda.Function(this, "CalcDamageFunction", {
      ...commonLambdaProps,
      functionName: "pokemon-tool-calc-damage",
      handler: "lambda/calc-handler.handler",
      description: "Pokemon SV damage calculation",
    })

    // ── Lambda: データ取得 ────────────────────────────────────
    const dataLambda = new lambda.Function(this, "DataFunction", {
      ...commonLambdaProps,
      functionName: "pokemon-tool-data",
      handler: "lambda/data-handler.handler",
      description: "Pokemon data from Google Sheets",
    })

    // Secrets Managerへの読み取り権限付与
    sheetsSecret.grantRead(calcLambda)
    sheetsSecret.grantRead(dataLambda)

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

    // /calc リソース
    const calcResource = api.root.addResource("calc")
    const calcDamageResource = calcResource.addResource("damage")
    calcDamageResource.addMethod("POST", new apigateway.LambdaIntegration(calcLambda, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' },
    }))

    // /data リソース
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
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    })

    // CloudFront OAC (Origin Access Control)
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
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html", // SPA対応
        },
      ],
    })

    // S3バケットポリシー: CloudFrontのみアクセス許可
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

    new cdk.CfnOutput(this, "SheetsSecretArn", {
      value: sheetsSecret.secretArn,
      description: "Secrets Manager ARN for Google Sheets credentials",
    })
  }
}
