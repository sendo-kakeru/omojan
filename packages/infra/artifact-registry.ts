import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";
import { parse, picklist } from "valibot";

const stack = parse(picklist(["dev", "prod", "stg"]), pulumi.getStack());
const gcpConfig = new pulumi.Config("gcp");
const project = gcpConfig.require("project");
const region = "asia-northeast1" as const;

const repositoryId = `image-processor-${stack}`;

export const registry = new gcp.artifactregistry.Repository(
	"image-processor-repo",
	{
		cleanupPolicies: [
			{
				action: "KEEP",
				id: "keep-recent-images",
				mostRecentVersions: {
					keepCount: 3,
					packageNamePrefixes: [],
				},
			},
			{
				action: "DELETE",
				condition: {
					olderThan: "7d",
					tagState: "UNTAGGED",
				},
				id: "delete-old-untagged",
			},
		],
		cleanupPolicyDryRun: false,
		description: "Docker images for the image-processor Cloud Run service",
		format: "DOCKER",
		location: region,
		repositoryId,
	},
);

export const registryUrl = pulumi.interpolate`${region}-docker.pkg.dev/${project}/${registry.repositoryId}`;
