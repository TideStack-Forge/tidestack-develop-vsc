import type { MetadataPathMapping, MetadataTypeContribution } from './types';
export declare const metadataTypeContributions: MetadataTypeContribution[];
export declare function getContributionByType(type: string): MetadataTypeContribution | undefined;
export declare function getContributionBySuffix(uri: string): MetadataTypeContribution | undefined;
export declare function getContributionByPackagedPath(uri: string): MetadataTypeContribution | undefined;
export declare function mapMetadataSourcePath(uri: string): MetadataPathMapping | undefined;
export declare function mapMetadataPackagedResourcePath(uri: string): MetadataPathMapping | undefined;
export declare function normalizePath(path: string): string;
