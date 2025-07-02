export abstract class BaseTool {
  abstract name: string;
  abstract description: string;
  abstract parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };

  abstract execute(args: any): Promise<string>;

  protected validateArgs(args: any): void {
    if (!this.parameters.required) return;

    for (const required of this.parameters.required) {
      if (!(required in args)) {
        throw new Error(`Missing required parameter: ${required}`);
      }
    }
  }
}