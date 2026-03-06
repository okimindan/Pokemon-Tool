#!/usr/bin/env node
/**
 * AWS CDK アプリケーションエントリポイント
 */

import "source-map-support/register"
import * as cdk from "aws-cdk-lib"
import { PokemonToolStack } from "../lib/pokemon-stack"

const app = new cdk.App()

new PokemonToolStack(app, "PokemonToolStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? "ap-northeast-1",
  },
  description: "Pokemon SV Damage Calculator Backend",
  tags: {
    Project: "PokemonTool",
    Environment: "Production",
  },
})

app.synth()
