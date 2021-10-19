export interface IPipelineRegistrySettings {
  access?: {
    name: string;
    access: 'deny' | 'allow';
    match?: any;
  }[];
}
