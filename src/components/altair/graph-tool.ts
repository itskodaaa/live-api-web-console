import { FunctionDeclaration, SchemaType } from '@google/generative-ai';

export const declaration: FunctionDeclaration = {
  name: 'display_graph',
  description: 'Displays a graph visualization based on a Vega-Lite or Vega JSON specification. Use this tool when the user asks to visualize data, create charts, or display graphs.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      vega_spec: {
        type: SchemaType.STRING,
        description: 'The JSON string of the Vega-Lite or Vega specification for the graph.',
      },
    },
    required: ['vega_spec'],
  },
};