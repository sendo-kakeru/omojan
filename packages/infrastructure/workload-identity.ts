import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";
import { parse, picklist } from "valibot";

const stack = parse(picklist(["dev", "prod", "stg"]), pulumi.getStack());
const gcpConfig = new pulumi.Config("gcp");
const project = gcpConfig.require("project");
const appConfig = new pulumi.Config("app");
const githubRepo = appConfig.require("githubRepo");

function createWorkloadIdentity() {
	// Workload Identity Pool
	const pool = new gcp.iam.WorkloadIdentityPool("github-pool", {
		description: "Workload Identity Pool for GitHub Actions",
		workloadIdentityPoolId: "github-actions",
	});

	// Workload Identity Pool Provider (GitHub OIDC)
	const provider = new gcp.iam.WorkloadIdentityPoolProvider("github-provider", {
		attributeCondition: `assertion.repository == '${githubRepo}'`,
		attributeMapping: {
			"attribute.repository": "assertion.repository",
			"google.subject": "assertion.sub",
		},
		oidc: {
			issuerUri: "https://token.actions.githubusercontent.com",
		},
		workloadIdentityPoolId: pool.workloadIdentityPoolId,
		workloadIdentityPoolProviderId: "github-oidc",
	});

	// Service Account for GitHub Actions
	const serviceAccount = new gcp.serviceaccount.Account("github-actions-sa", {
		accountId: "github-actions",
		description: "Service account for GitHub Actions CI/CD",
		displayName: "GitHub Actions",
	});

	// Artifact Registry Writer role
	new gcp.projects.IAMMember("sa-artifact-registry-writer", {
		member: pulumi.interpolate`serviceAccount:${serviceAccount.email}`,
		project,
		role: "roles/artifactregistry.writer",
	});

	// Cloud Run Developer role
	new gcp.projects.IAMMember("sa-cloud-run-developer", {
		member: pulumi.interpolate`serviceAccount:${serviceAccount.email}`,
		project,
		role: "roles/run.developer",
	});

	// Allow Cloud Run to use this service account
	new gcp.projects.IAMMember("sa-act-as", {
		member: pulumi.interpolate`serviceAccount:${serviceAccount.email}`,
		project,
		role: "roles/iam.serviceAccountUser",
	});

	// Allow GitHub Actions to impersonate the service account via WIF
	new gcp.serviceaccount.IAMBinding("workload-identity-binding", {
		members: [
			pulumi.interpolate`principalSet://iam.googleapis.com/${pool.name}/attribute.repository/${githubRepo}`,
		],
		role: "roles/iam.workloadIdentityUser",
		serviceAccountId: serviceAccount.name,
	});

	// Service Account for CDN Worker → Cloud Run invocation
	const invokerServiceAccount = new gcp.serviceaccount.Account(
		"cloud-run-invoker-sa",
		{
			accountId: "cloud-run-invoker",
			description: "Service account for CDN Worker to invoke Cloud Run",
			displayName: "Cloud Run Invoker",
		},
	);

	// Cloud Run Invoker role
	new gcp.projects.IAMMember("invoker-cloud-run", {
		member: pulumi.interpolate`serviceAccount:${invokerServiceAccount.email}`,
		project,
		role: "roles/run.invoker",
	});

	return {
		invokerServiceAccountEmail: invokerServiceAccount.email,
		serviceAccountEmail: serviceAccount.email,
		workloadIdentityProvider: provider.name,
	};
}

// 環境共通リソースのため prod スタックでのみ作成
const result = stack === "prod" ? createWorkloadIdentity() : undefined;

export const workloadIdentityProvider = result?.workloadIdentityProvider;
export const serviceAccountEmail = result?.serviceAccountEmail;
export const invokerServiceAccountEmail = result?.invokerServiceAccountEmail;
