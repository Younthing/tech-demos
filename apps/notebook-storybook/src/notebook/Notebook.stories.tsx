import type { Meta, StoryObj } from "@storybook/react-vite";
import { NotebookApp } from "./NotebookApp";

const meta = {
  title: "Notebook/Document",
  component: NotebookApp,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Editable markdown and code cells. Run sends an execute_request to the in-memory kernel and renders stream, rich, and error outputs.",
      },
    },
  },
} satisfies Meta<typeof NotebookApp>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Editable: Story = {};
