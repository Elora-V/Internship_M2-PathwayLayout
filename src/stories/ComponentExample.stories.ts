import type { Meta, StoryObj } from "@storybook/vue3";
import ComponentExample from "../components/ComponentExample.vue";

const meta: Meta<typeof ComponentExample> = {
  title: "ComponentExample",
  component: ComponentExample,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ComponentExample>;

export const Default: Story = {
  render: () => ({
    components: { ComponentExample },
    template: "<ComponentExample />",
  }),
};
